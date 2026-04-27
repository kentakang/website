import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resume } from '../data/resume';

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 56;
const bottomMargin = 56;
const contentWidth = pageWidth - margin * 2;

type FontName = 'regular' | 'bold';

interface Page {
  commands: string[];
}

interface TextOptions {
  size?: number;
  font?: FontName;
  indent?: number;
  x?: number;
  maxWidth?: number;
  gapAfter?: number;
  color?: [number, number, number];
}

const encoder = new TextEncoder();

const byteLength = (value: string) => encoder.encode(value).length;

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const getJpegDimensions = (bytes: Uint8Array) => {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Profile photo must be a JPEG image.');
  }

  let offset = 2;

  while (offset < bytes.length) {
    while (bytes[offset] === 0xff) {
      offset += 1;
    }

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const length = (bytes[offset] << 8) + bytes[offset + 1];
    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 3] << 8) + bytes[offset + 4],
        width: (bytes[offset + 5] << 8) + bytes[offset + 6],
      };
    }

    offset += length;
  }

  throw new Error('Could not read profile photo dimensions.');
};

const profilePhotoBytes = readFileSync(
  join(process.cwd(), 'public/images/profile.jpg'),
);
const profilePhoto = {
  ...getJpegDimensions(profilePhotoBytes),
  stream: `${bytesToHex(profilePhotoBytes)}>`,
};

const cleanText = (value: string) => value.replace(/[^\x20-\x7E]/g, '?');

const escapePdfText = (value: string) =>
  cleanText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const fontResource = (font: FontName) => (font === 'bold' ? 'F2' : 'F1');

const wrapText = (text: string, size: number, maxWidth: number) => {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const approxWidth = next.length * size * 0.5;

    if (approxWidth <= maxWidth || current.length === 0) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

export const createResumePdf = () => {
  const pages: Page[] = [{ commands: [] }];
  let y = pageHeight - margin;

  const currentPage = () => pages[pages.length - 1];

  const addPage = () => {
    pages.push({ commands: [] });
    y = pageHeight - margin;
  };

  const ensureSpace = (height: number) => {
    if (y - height < bottomMargin) {
      addPage();
    }
  };

  const addTextLine = (
    text: string,
    x: number,
    lineY: number,
    size: number,
    font: FontName,
    color: [number, number, number],
  ) => {
    currentPage().commands.push(
      `${color.join(' ')} rg BT /${fontResource(font)} ${size} Tf ${x.toFixed(2)} ${lineY.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`,
    );
  };

  const getParagraphHeight = (text: string, options: TextOptions = {}) => {
    const size = options.size ?? 10;
    const indent = options.indent ?? 0;
    const gapAfter = options.gapAfter ?? 8;
    const lineHeight = size * 1.35;

    const maxWidth = options.maxWidth ?? contentWidth;

    return wrapText(text, size, maxWidth - indent).length * lineHeight + gapAfter;
  };

  const ensureTextBlock = (blocks: Array<{ text: string; options?: TextOptions }>) => {
    ensureSpace(
      blocks.reduce(
        (height, block) => height + getParagraphHeight(block.text, block.options),
        0,
      ),
    );
  };

  const addParagraph = (text: string, options: TextOptions = {}) => {
    const size = options.size ?? 10;
    const font = options.font ?? 'regular';
    const indent = options.indent ?? 0;
    const x = options.x ?? margin;
    const maxWidth = options.maxWidth ?? contentWidth;
    const gapAfter = options.gapAfter ?? 8;
    const color = options.color ?? [0.09, 0.09, 0.09];
    const lineHeight = size * 1.35;
    const lines = wrapText(text, size, maxWidth - indent);

    ensureSpace(lines.length * lineHeight + gapAfter);

    for (const line of lines) {
      addTextLine(line, x + indent, y, size, font, color);
      y -= lineHeight;
    }

    y -= gapAfter;
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(34);
    y -= 8;
    addTextLine(title, margin, y, 14, 'bold', [0.09, 0.09, 0.09]);
    y -= 22;
  };

  const addRule = () => {
    ensureSpace(14);
    currentPage().commands.push(
      `0.82 0.82 0.82 RG 0.5 w ${margin.toFixed(2)} ${y.toFixed(2)} m ${(pageWidth - margin).toFixed(2)} ${y.toFixed(2)} l S`,
    );
    y -= 16;
  };

  const addImage = (
    name: string,
    x: number,
    topY: number,
    width: number,
    height: number,
  ) => {
    currentPage().commands.push(
      `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${(topY - height).toFixed(2)} cm /${name} Do Q`,
    );
  };

  const photoSize = 64;
  const headerGap = 18;
  const headerTextX = margin + photoSize + headerGap;
  const headerTextWidth = contentWidth - photoSize - headerGap;
  const headerTop = y;

  addImage('ProfilePhoto', margin, headerTop, photoSize, photoSize);
  y = headerTop - 20;
  addTextLine(resume.name, headerTextX, y, 26, 'bold', [0.09, 0.09, 0.09]);
  y -= 22;
  addParagraph(`${resume.title} based in ${resume.location}`, {
    x: headerTextX,
    maxWidth: headerTextWidth,
    size: 11,
    color: [0.18, 0.18, 0.18],
    gapAfter: 4,
  });
  addParagraph(
    [
      resume.email,
      ...resume.links.map((link) => link.url.replace(/^https?:\/\//, '')),
    ].join(' | '),
    {
      x: headerTextX,
      maxWidth: headerTextWidth,
      size: 8.8,
      color: [0.03, 0.25, 0.4],
      gapAfter: 0,
    },
  );
  y = Math.min(y, headerTop - photoSize - 12);
  addRule();

  addSectionTitle('Summary');
  for (const paragraph of resume.summary) {
    addParagraph(paragraph, { size: 10.5, gapAfter: 7 });
  }

  addSectionTitle('Skills');
  for (const skill of resume.skills) {
    addParagraph(`- ${skill}`, { size: 10, indent: 10, gapAfter: 4 });
  }

  addSectionTitle('Experience');
  for (const experience of resume.experiences) {
    const organization = `${experience.organization}${'suffix' in experience ? experience.suffix : ''}`;
    const role = `${experience.role} at ${organization}`;

    ensureTextBlock([
      { text: experience.period, options: { size: 9.5, font: 'bold', gapAfter: 2 } },
      {
        text: role,
        options: { size: 10.5, gapAfter: experience.url ? 2 : 10 },
      },
      ...(experience.url
        ? [
            {
              text: experience.url,
              options: {
                size: 9,
                color: [0.03, 0.25, 0.4] as [number, number, number],
                gapAfter: 10,
              },
            },
          ]
        : []),
    ]);

    addParagraph(experience.period, { size: 9.5, font: 'bold', gapAfter: 2 });
    addParagraph(role, {
      size: 10.5,
      gapAfter: experience.url ? 2 : 10,
    });
    if (experience.url) {
      addParagraph(experience.url, {
        size: 9,
        color: [0.03, 0.25, 0.4],
        gapAfter: 10,
      });
    }
  }

  addSectionTitle('Personal Projects');
  for (const project of resume.projects) {
    const projectRole = `${project.role} | ${project.url}`;

    ensureTextBlock([
      { text: project.name, options: { size: 10.5, font: 'bold', gapAfter: 2 } },
      { text: project.description, options: { size: 10, gapAfter: 2 } },
      {
        text: projectRole,
        options: {
          size: 9,
          color: [0.03, 0.25, 0.4],
          gapAfter: 10,
        },
      },
    ]);

    addParagraph(project.name, { size: 10.5, font: 'bold', gapAfter: 2 });
    addParagraph(project.description, { size: 10, gapAfter: 2 });
    addParagraph(projectRole, {
      size: 9,
      color: [0.03, 0.25, 0.4],
      gapAfter: 10,
    });
  }

  addSectionTitle('Open Source Contributions');
  for (const contribution of resume.contributions) {
    const contributionTitle = `${contribution.name} | ${contribution.url}`;

    ensureTextBlock([
      {
        text: contributionTitle,
        options: {
          size: 9.5,
          font: 'bold',
          color: [0.03, 0.25, 0.4],
          gapAfter: 3,
        },
      },
      ...contribution.pulls.flatMap((pull) => [
        { text: `- ${pull.title}`, options: { size: 9.5, indent: 10, gapAfter: 2 } },
        {
          text: pull.url,
          options: {
            size: 8.5,
            indent: 10,
            color: [0.03, 0.25, 0.4] as [number, number, number],
            gapAfter: 8,
          },
        },
      ]),
    ]);

    addParagraph(contributionTitle, {
      size: 9.5,
      font: 'bold',
      color: [0.03, 0.25, 0.4],
      gapAfter: 3,
    });

    for (const pull of contribution.pulls) {
      addParagraph(`- ${pull.title}`, { size: 9.5, indent: 10, gapAfter: 2 });
      addParagraph(pull.url, {
        size: 8.5,
        indent: 10,
        color: [0.03, 0.25, 0.4],
        gapAfter: 8,
      });
    }
  }

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Type /XObject /Subtype /Image /Width ${profilePhoto.width} /Height ${profilePhoto.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${byteLength(profilePhoto.stream)} >>\nstream\n${profilePhoto.stream}\nendstream`,
  ];

  const pageRefs = pages.map((_, index) => `${6 + index * 2} 0 R`).join(' ');
  objects[1] = `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`;

  for (const [index, page] of pages.entries()) {
    const pageObjectNumber = 6 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = page.commands.join('\n');

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /ProfilePhoto 5 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.push(`<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (const [index, object] of objects.entries()) {
    offsets.push(byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }

  const xrefOffset = byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (const offset of offsets) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return encoder.encode(pdf);
};

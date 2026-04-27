import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { resume } from '../data/resume';

type FontName = 'regular' | 'bold';
type Rgb = readonly [number, number, number];

interface Page {
  commands: string[];
}

interface TextStyle {
  fontSize: number;
  lineHeight: number;
  font: FontName;
  color: Rgb;
}

interface TextBlockOptions {
  x?: number;
  maxWidth?: number;
  gapAfter?: number;
  indent?: number;
}

const theme = {
  page: {
    width: 595.28,
    height: 841.89,
  },
  color: {
    text: {
      primary: [0.07, 0.08, 0.1] as Rgb,
      secondary: [0.22, 0.24, 0.28] as Rgb,
      muted: [0.42, 0.45, 0.5] as Rgb,
    },
    accent: [0.02, 0.2, 0.33] as Rgb,
    rule: [0.82, 0.84, 0.87] as Rgb,
  },
  typography: {
    name: {
      fontSize: 22.5,
      lineHeight: 24,
      font: 'bold',
      color: [0.06, 0.07, 0.09] as Rgb,
    },
    headline: {
      fontSize: 10.5,
      lineHeight: 13.5,
      font: 'regular',
      color: [0.22, 0.24, 0.28] as Rgb,
    },
    contact: {
      fontSize: 8.7,
      lineHeight: 11.2,
      font: 'regular',
      color: [0.02, 0.2, 0.33] as Rgb,
    },
    sectionTitle: {
      fontSize: 11.5,
      lineHeight: 14,
      font: 'bold',
      color: [0.07, 0.08, 0.1] as Rgb,
    },
    itemTitle: {
      fontSize: 9.8,
      lineHeight: 12.3,
      font: 'bold',
      color: [0.07, 0.08, 0.1] as Rgb,
    },
    body: {
      fontSize: 9.6,
      lineHeight: 12.6,
      font: 'regular',
      color: [0.1, 0.11, 0.13] as Rgb,
    },
    metadata: {
      fontSize: 8.6,
      lineHeight: 11.2,
      font: 'regular',
      color: [0.42, 0.45, 0.5] as Rgb,
    },
    link: {
      fontSize: 8.5,
      lineHeight: 11,
      font: 'regular',
      color: [0.02, 0.2, 0.33] as Rgb,
    },
    bullet: {
      fontSize: 9.4,
      lineHeight: 12.2,
      font: 'regular',
      color: [0.1, 0.11, 0.13] as Rgb,
    },
  },
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    sectionGap: 14,
    sectionTitleGap: 6,
    itemGap: 11,
    compactItemGap: 8,
    bulletGap: 3,
    paragraphGap: 5,
    headerAfter: 10,
    headerNameInset: 18,
  },
  layout: {
    pageMargin: 52,
    bottomMargin: 52,
    profilePhotoSize: 56,
    headerGap: 18,
    metadataColumnWidth: 114,
    columnGap: 14,
    bulletIndent: 14,
    bulletMarkerWidth: 8,
  },
  border: {
    ruleWidth: 0.45,
  },
} as const;

const contentWidth = theme.page.width - theme.layout.pageMargin * 2;
const pageTop = theme.page.height - theme.layout.pageMargin;
const pageUsableHeight = pageTop - theme.layout.bottomMargin;

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

const cleanText = (value: string) =>
  value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E]/g, '?');

const escapePdfText = (value: string) =>
  cleanText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const fontResource = (font: FontName) => (font === 'bold' ? 'F2' : 'F1');

const helveticaWidths: Record<string, number> = {
  ' ': 278,
  '!': 278,
  '"': 355,
  '#': 556,
  $: 556,
  '%': 889,
  '&': 667,
  "'": 191,
  '(': 333,
  ')': 333,
  '*': 389,
  '+': 584,
  ',': 278,
  '-': 333,
  '.': 278,
  '/': 278,
  ':': 278,
  ';': 278,
  '<': 584,
  '=': 584,
  '>': 584,
  '?': 556,
  '@': 1015,
  '[': 278,
  '\\': 278,
  ']': 278,
  '^': 469,
  _: 556,
  '`': 333,
  '{': 334,
  '|': 260,
  '}': 334,
  '~': 584,
};

for (const char of '0123456789') {
  helveticaWidths[char] = 556;
}

Object.assign(helveticaWidths, {
  A: 667,
  B: 667,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 500,
  K: 667,
  L: 556,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  a: 556,
  b: 556,
  c: 500,
  d: 556,
  e: 556,
  f: 278,
  g: 556,
  h: 556,
  i: 222,
  j: 222,
  k: 500,
  l: 222,
  m: 833,
  n: 556,
  o: 556,
  p: 556,
  q: 556,
  r: 333,
  s: 500,
  t: 278,
  u: 556,
  v: 500,
  w: 722,
  x: 500,
  y: 500,
  z: 500,
});

const helveticaBoldWidths: Record<string, number> = {
  ...helveticaWidths,
  A: 722,
  B: 722,
  C: 722,
  D: 722,
  E: 667,
  F: 611,
  G: 778,
  H: 722,
  I: 278,
  J: 556,
  K: 722,
  L: 611,
  M: 833,
  N: 722,
  O: 778,
  P: 667,
  Q: 778,
  R: 722,
  S: 667,
  T: 611,
  U: 722,
  V: 667,
  W: 944,
  X: 667,
  Y: 667,
  Z: 611,
  b: 556,
  c: 556,
  f: 333,
  h: 556,
  i: 278,
  j: 278,
  k: 556,
  l: 278,
  m: 833,
  r: 389,
  s: 556,
  t: 333,
  w: 722,
  x: 556,
};

const measureText = (text: string, size: number, font: FontName = 'regular') => {
  const widths = font === 'bold' ? helveticaBoldWidths : helveticaWidths;

  return Array.from(cleanText(text)).reduce(
    (width, char) => width + ((widths[char] ?? 500) / 1000) * size,
    0,
  );
};

const breakLongWord = (word: string, style: TextStyle, maxWidth: number) => {
  const pieces: string[] = [];
  let current = '';

  for (const char of Array.from(word)) {
    const next = `${current}${char}`;

    if (current && measureText(next, style.fontSize, style.font) > maxWidth) {
      pieces.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
};

const wrapText = (text: string, style: TextStyle, maxWidth: number) => {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const wordPieces =
      measureText(word, style.fontSize, style.font) > maxWidth
        ? breakLongWord(word, style, maxWidth)
        : [word];

    for (const piece of wordPieces) {
      const next = current ? `${current} ${piece}` : piece;

      if (!current || measureText(next, style.fontSize, style.font) <= maxWidth) {
        current = next;
      } else {
        lines.push(current);
        current = piece;
      }
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const getTextBlockHeight = (
  text: string,
  style: TextStyle,
  options: TextBlockOptions = {},
) => {
  const maxWidth = options.maxWidth ?? contentWidth;
  const indent = options.indent ?? 0;
  const gapAfter = options.gapAfter ?? 0;
  return wrapText(text, style, maxWidth - indent).length * style.lineHeight + gapAfter;
};

export const createResumePdf = () => {
  const pages: Page[] = [{ commands: [] }];
  let y = pageTop;

  const currentPage = () => pages[pages.length - 1];

  const addPage = () => {
    pages.push({ commands: [] });
    y = pageTop;
  };

  const ensureSpace = (height: number) => {
    if (height <= pageUsableHeight && y - height < theme.layout.bottomMargin) {
      addPage();
    }
  };

  const ensureLineSpace = (height: number) => {
    if (y - height < theme.layout.bottomMargin) {
      addPage();
    }
  };

  const addTextLine = (
    text: string,
    x: number,
    lineY: number,
    style: TextStyle,
    color: Rgb = style.color,
  ) => {
    currentPage().commands.push(
      `${color.join(' ')} rg BT /${fontResource(style.font)} ${style.fontSize} Tf ${x.toFixed(2)} ${lineY.toFixed(2)} Td (${escapePdfText(text)}) Tj ET`,
    );
  };

  const addRightAlignedTextLine = (
    text: string,
    rightX: number,
    lineY: number,
    style: TextStyle,
  ) => {
    addTextLine(
      text,
      rightX - measureText(text, style.fontSize, style.font),
      lineY,
      style,
    );
  };

  const addRule = (lineY = y) => {
    const left = theme.layout.pageMargin;
    const right = theme.page.width - theme.layout.pageMargin;

    currentPage().commands.push(
      `${theme.color.rule.join(' ')} RG ${theme.border.ruleWidth} w ${left.toFixed(2)} ${lineY.toFixed(2)} m ${right.toFixed(2)} ${lineY.toFixed(2)} l S`,
    );
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

  const addParagraph = (
    text: string,
    style: TextStyle,
    options: TextBlockOptions = {},
  ) => {
    const x = options.x ?? theme.layout.pageMargin;
    const maxWidth = options.maxWidth ?? contentWidth;
    const indent = options.indent ?? 0;
    const gapAfter = options.gapAfter ?? 0;
    const lines = wrapText(text, style, maxWidth - indent);
    const blockHeight = lines.length * style.lineHeight + gapAfter;

    ensureSpace(blockHeight);

    for (const line of lines) {
      ensureLineSpace(style.lineHeight);
      addTextLine(line, x + indent, y, style);
      y -= style.lineHeight;
    }

    if (gapAfter > 0) {
      if (y - gapAfter < theme.layout.bottomMargin) {
        addPage();
      } else {
        y -= gapAfter;
      }
    }
  };

  const addBullet = (text: string, gapAfter: number = theme.spacing.bulletGap) => {
    const markerX = theme.layout.pageMargin;
    const textX =
      theme.layout.pageMargin +
      theme.layout.bulletIndent +
      theme.layout.bulletMarkerWidth;
    const maxWidth =
      contentWidth -
      theme.layout.bulletIndent -
      theme.layout.bulletMarkerWidth;
    const lines = wrapText(text, theme.typography.bullet, maxWidth);
    const blockHeight = lines.length * theme.typography.bullet.lineHeight + gapAfter;

    ensureSpace(blockHeight);

    for (const [index, line] of lines.entries()) {
      ensureLineSpace(theme.typography.bullet.lineHeight);

      if (index === 0) {
        addTextLine('-', markerX + theme.layout.bulletIndent, y, theme.typography.bullet);
      }

      addTextLine(line, textX, y, theme.typography.bullet);
      y -= theme.typography.bullet.lineHeight;
    }

    y -= gapAfter;
  };

  const getSectionTitleHeight = (firstContentHeight = 0) =>
    theme.spacing.sectionGap +
    theme.typography.sectionTitle.lineHeight +
    theme.spacing.sectionTitleGap +
    firstContentHeight;

  const addSectionTitle = (title: string, firstContentHeight = 0) => {
    ensureSpace(getSectionTitleHeight(firstContentHeight));

    if (y < pageTop) {
      y -= theme.spacing.sectionGap;
    }

    addTextLine(title, theme.layout.pageMargin, y, theme.typography.sectionTitle);
    y -= theme.typography.sectionTitle.lineHeight + theme.spacing.sectionTitleGap;
  };

  const getHeadingRowHeight = (
    title: string,
    metadata?: string,
    titleStyle: TextStyle = theme.typography.itemTitle,
  ) => {
    const titleWidth = metadata
      ? contentWidth - theme.layout.metadataColumnWidth - theme.layout.columnGap
      : contentWidth;
    const titleHeight =
      wrapText(title, titleStyle, titleWidth).length * titleStyle.lineHeight;
    const metadataHeight = metadata
      ? wrapText(
          metadata,
          theme.typography.metadata,
          theme.layout.metadataColumnWidth,
        ).length * theme.typography.metadata.lineHeight
      : 0;

    return Math.max(titleHeight, metadataHeight);
  };

  const addHeadingRow = (
    title: string,
    metadata?: string,
    titleStyle: TextStyle = theme.typography.itemTitle,
  ) => {
    const titleWidth = metadata
      ? contentWidth - theme.layout.metadataColumnWidth - theme.layout.columnGap
      : contentWidth;
    const titleLines = wrapText(title, titleStyle, titleWidth);
    const metadataLines = metadata
      ? wrapText(metadata, theme.typography.metadata, theme.layout.metadataColumnWidth)
      : [];
    const rowHeight = getHeadingRowHeight(title, metadata, titleStyle);

    ensureSpace(rowHeight);

    const rowTop = y;
    for (const [index, line] of titleLines.entries()) {
      addTextLine(
        line,
        theme.layout.pageMargin,
        rowTop - index * titleStyle.lineHeight,
        titleStyle,
      );
    }

    if (metadataLines.length > 0) {
      const rightX = theme.page.width - theme.layout.pageMargin;

      for (const [index, line] of metadataLines.entries()) {
        addRightAlignedTextLine(
          line,
          rightX,
          rowTop - index * theme.typography.metadata.lineHeight,
          theme.typography.metadata,
        );
      }
    }

    y -= rowHeight;
  };

  const getExperienceHeight = (experience: (typeof resume.experiences)[number]) => {
    const organization = `${experience.organization}${'suffix' in experience ? experience.suffix : ''}`;
    const role = `${experience.role} at ${organization}`;
    const url = 'url' in experience ? experience.url : undefined;

    return (
      getHeadingRowHeight(role, experience.period) +
      (url
        ? getTextBlockHeight(url, theme.typography.link, {
            gapAfter: theme.spacing.itemGap,
          })
        : theme.spacing.itemGap)
    );
  };

  const addExperience = (experience: (typeof resume.experiences)[number]) => {
    const organization = `${experience.organization}${'suffix' in experience ? experience.suffix : ''}`;
    const role = `${experience.role} at ${organization}`;
    const url = 'url' in experience ? experience.url : undefined;
    const itemHeight = getExperienceHeight(experience);

    ensureSpace(itemHeight);
    addHeadingRow(role, experience.period);

    if (url) {
      addParagraph(url, theme.typography.link, {
        gapAfter: theme.spacing.itemGap,
      });
    } else {
      y -= theme.spacing.itemGap;
    }
  };

  const getProjectHeight = (project: (typeof resume.projects)[number]) => {
    const projectRole = `${project.role} | ${project.url}`;

    return (
      getHeadingRowHeight(project.name) +
      theme.spacing.xxs +
      getTextBlockHeight(project.description, theme.typography.body, {
        gapAfter: theme.spacing.xs,
      }) +
      getTextBlockHeight(projectRole, theme.typography.link, {
        gapAfter: theme.spacing.itemGap,
      })
    );
  };

  const addProject = (project: (typeof resume.projects)[number]) => {
    const projectRole = `${project.role} | ${project.url}`;

    ensureSpace(getProjectHeight(project));
    addHeadingRow(project.name);
    y -= theme.spacing.xxs;
    addParagraph(project.description, theme.typography.body, {
      gapAfter: theme.spacing.xs,
    });
    addParagraph(projectRole, theme.typography.link, {
      gapAfter: theme.spacing.itemGap,
    });
  };

  const getContributionHeight = (
    contribution: (typeof resume.contributions)[number],
  ) => {
    const contributionTitle = `${contribution.name} | ${contribution.url}`;
    const pullsHeight = contribution.pulls.reduce(
      (height, pull) =>
        height +
        getTextBlockHeight(pull.title, theme.typography.bullet, {
          indent:
            theme.layout.bulletIndent + theme.layout.bulletMarkerWidth,
          gapAfter: theme.spacing.xs,
        }) +
        getTextBlockHeight(pull.url, theme.typography.link, {
          indent:
            theme.layout.bulletIndent + theme.layout.bulletMarkerWidth,
          gapAfter: theme.spacing.compactItemGap,
        }),
      0,
    );

    return (
      getHeadingRowHeight(contributionTitle, undefined, {
        ...theme.typography.itemTitle,
        color: theme.color.accent,
      }) +
      theme.spacing.xs +
      pullsHeight
    );
  };

  const addContribution = (
    contribution: (typeof resume.contributions)[number],
  ) => {
    const contributionTitle = `${contribution.name} | ${contribution.url}`;

    ensureSpace(getContributionHeight(contribution));
    addHeadingRow(contributionTitle, undefined, {
      ...theme.typography.itemTitle,
      color: theme.color.accent,
    });
    y -= theme.spacing.xs;

    for (const pull of contribution.pulls) {
      addBullet(pull.title, theme.spacing.xs);
      addParagraph(pull.url, theme.typography.link, {
        indent:
          theme.layout.bulletIndent + theme.layout.bulletMarkerWidth,
        gapAfter: theme.spacing.compactItemGap,
      });
    }
  };

  const headerTop = y;
  const photoSize = theme.layout.profilePhotoSize;
  const headerTextX =
    theme.layout.pageMargin + photoSize + theme.layout.headerGap;
  const headerTextWidth =
    contentWidth - photoSize - theme.layout.headerGap;
  const contact = [
    resume.email,
    ...resume.links.map((link) => link.url.replace(/^https?:\/\//, '')),
  ].join(' | ');

  addImage('ProfilePhoto', theme.layout.pageMargin, headerTop, photoSize, photoSize);
  y = headerTop - theme.spacing.headerNameInset;
  addTextLine(resume.name, headerTextX, y, theme.typography.name);
  y -= theme.typography.name.lineHeight;
  for (const line of wrapText(
    `${resume.title} based in ${resume.location}`,
    theme.typography.headline,
    headerTextWidth,
  )) {
    addTextLine(line, headerTextX, y, theme.typography.headline);
    y -= theme.typography.headline.lineHeight;
  }

  y -= theme.spacing.xs;
  for (const line of wrapText(contact, theme.typography.contact, headerTextWidth)) {
    addTextLine(line, headerTextX, y, theme.typography.contact);
    y -= theme.typography.contact.lineHeight;
  }

  y = Math.min(y, headerTop - photoSize) - theme.spacing.headerAfter;
  addRule();
  y -= theme.spacing.lg;

  addSectionTitle(
    'Summary',
    getTextBlockHeight(resume.summary[0], theme.typography.body),
  );
  for (const [index, paragraph] of resume.summary.entries()) {
    addParagraph(paragraph, theme.typography.body, {
      gapAfter:
        index === resume.summary.length - 1
          ? 0
          : theme.spacing.paragraphGap,
    });
  }

  addSectionTitle('Skills', theme.typography.bullet.lineHeight);
  for (const skill of resume.skills) {
    addBullet(skill);
  }

  addSectionTitle('Experience', getExperienceHeight(resume.experiences[0]));
  for (const experience of resume.experiences) {
    addExperience(experience);
  }

  addSectionTitle('Personal Projects', getProjectHeight(resume.projects[0]));
  for (const project of resume.projects) {
    addProject(project);
  }

  addSectionTitle(
    'Open Source Contributions',
    getContributionHeight(resume.contributions[0]),
  );
  for (const contribution of resume.contributions) {
    addContribution(contribution);
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
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${theme.page.width} ${theme.page.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /ProfilePhoto 5 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
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

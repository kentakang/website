import type { APIRoute } from 'astro';
import { createResumePdf } from '../utils/createResumePdf';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(createResumePdf(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
    },
  });

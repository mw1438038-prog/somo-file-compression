import { ArrowLeft } from 'lucide-react';
import type { SitePageKey } from '@/lib/legalRoutes';
import { SITE_PAGE_SEO } from '@/lib/siteSeo';

interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  faqs?: { question: string; answer: string }[];
  contactLink?: boolean;
}

interface LegalDocument {
  title: string;
  introduction: string;
  sections: LegalSection[];
}

const PAGE_DOCUMENTS: Record<SitePageKey, LegalDocument> = {
  about: {
    title: 'About Us',
    introduction:
      'Somo File Compression helps people reduce the size of PDF files through a straightforward online tool.',
    sections: [
      {
        heading: 'Our purpose',
        paragraphs: [
          'The goal of Somo File Compression is to make common PDF compression tasks easier to approach. The service lets people choose a compression level and download a processed PDF.',
        ],
      },
      {
        heading: 'A practical PDF compression tool',
        paragraphs: [
          'PDFs are processed through a Supabase Edge Function using a third-party Ghostscript WebAssembly package. Files may be up to 10 MB. Results depend on the input file and selected compression level; some documents may fail to process, and compression does not guarantee unchanged quality.',
        ],
      },
      {
        heading: 'Currently free to use',
        paragraphs: [
          'Somo File Compression currently has no paid plans, subscriptions, or payment processing. This describes the current service and is not a promise that it will always remain free.',
        ],
      },
      {
        heading: 'Designed around people',
        paragraphs: [
          'We aim to keep the workflow simple: choose a PDF, select a compression level, and download the result. The interface is designed to work across screen sizes, and account access is available through Supabase Auth.',
          'Privacy is an important consideration in how the service is described and built. The Privacy Policy explains the information handled by the current application, including PDF processing and service providers.',
        ],
      },
    ],
  },
  help: {
    title: 'Help Center',
    introduction:
      'Find guidance for using Somo File Compression and resolving common account or PDF processing issues.',
    sections: [
      {
        heading: 'Create an account and log in',
        paragraphs: [
          'Choose Sign up and enter your name, email address, and password. If email confirmation is requested, follow the message sent to your email address. Then choose Log in and enter your email and password. The compressor dashboard is available after you sign in.',
        ],
      },
      {
        heading: 'Compress and download a PDF',
        paragraphs: [
          'In the dashboard, choose a PDF by browsing or dragging it into the upload area. The maximum file size is 10 MB. Select a compression mode and choose Compress PDF. When processing completes, use Download compressed PDF to save the result.',
        ],
      },
      {
        heading: 'Choose a compression mode',
        bullets: [
          'Extreme: prioritizes a smaller file and may reduce image detail more noticeably.',
          'Recommended: a balanced setting for file size and image detail.',
          'Less: prioritizes higher image detail and may produce more modest size reduction.',
        ],
      },
      {
        heading: 'PDF troubleshooting',
        bullets: [
          'Invalid PDF: make sure the file is a readable PDF, not another file renamed with a .pdf extension.',
          'Password-protected PDF: remove the password protection using a tool you trust, then try again.',
          'Corrupted or unreadable PDF: try opening the file in a PDF reader and exporting or saving a fresh copy.',
          'Complex PDF or processing limit: try a smaller document or choose a lighter compression mode. Some PDFs cannot be processed successfully.',
          'Upload too large: the file must be 10 MB or smaller.',
          'Compression failed: try again later or try another PDF. Processing depends on the file and available service resources.',
        ],
      },
      {
        heading: 'Account and login troubleshooting',
        bullets: [
          'Check that you entered the same email address and password used to create the account.',
          'If the account requires email confirmation, confirm the address before logging in. The login screen offers a confirmation-email resend option when appropriate.',
          'If you forgot your password, use the Forgot your password link on the login screen to request reset instructions.',
          'If login still fails, check your connection and try again later.',
        ],
      },
      {
        heading: 'Frequently asked questions',
        faqs: [
          {
            question: 'Is the service free?',
            answer:
              'It currently has no paid plans or payment processing. This may change in the future.',
          },
          {
            question: 'What is the upload limit?',
            answer: 'PDFs must be no larger than 10 MB.',
          },
          {
            question: 'Will every PDF compress successfully?',
            answer:
              'No. Invalid, damaged, password-protected, or complex PDFs may fail.',
          },
          {
            question: 'Will the result always be smaller or look identical?',
            answer:
              'Not necessarily. Compression results vary, and image detail can change depending on the mode and document.',
          },
        ],
      },
      {
        heading: 'Contact support',
        paragraphs: [
          'If you still need help, use the Contact Us form on the main website.',
        ],
        contactLink: true,
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    introduction:
      'This policy explains what information is handled when you use Somo File Compression and how it is used in the service.',
    sections: [
      {
        heading: 'Information we collect',
        paragraphs: [
          'When you create an account, the signup form collects your name and email address. Supabase Auth handles account authentication, and your password is used by that authentication service.',
          'When you use the contact form, it collects your name, email address, subject, and message. Contact submissions are saved in the Supabase contact_submissions table, which is restricted to service-role access. The form is limited to five submissions per hour, and contact notifications are sent using Resend.',
        ],
      },
      {
        heading: 'PDF processing',
        paragraphs: [
          'A PDF you submit for compression is sent to a Supabase Edge Function, which processes it using a third-party Ghostscript WebAssembly package. The maximum upload size is 10 MB. Some invalid, damaged, password-protected, or complex PDFs may not be processed successfully.',
          'The visible compression flow does not upload PDFs to Supabase Storage. This does not establish how long service providers may process, log, or retain information as part of operating their services; no zero-retention or immediate-deletion promise is made here.',
        ],
      },
      {
        heading: 'Service providers',
        paragraphs: [
          'The website is hosted by Vercel. Supabase provides authentication and backend processing. Resend is used for contact notifications. These providers handle information as needed to provide their services. Their own privacy terms and practices apply to their systems; consult their current documentation for details.',
        ],
      },
      {
        heading: 'Browser storage',
        paragraphs: [
          'Supabase Auth uses persistent browser storage for authentication sessions so that a signed-in session can continue between visits. See the Cookie Policy for more information about browser storage and tracking technologies.',
        ],
      },
      {
        heading: 'Security and retention',
        paragraphs: [
          'The service uses authentication, access controls, and request rate limits. No method of transmission or storage can be represented as completely secure. Contact submissions are stored in the database; a specific retention period has not been established in this policy. Provider-side processing and retention are governed by the relevant provider terms.',
        ],
      },
      {
        heading: 'Privacy requests and contact',
        paragraphs: [
          'You may submit a privacy-related question or request using the Contact Us form on the website. The form collects the information described above.',
          'TODO for owner: confirm and publish a suitable privacy contact email address before relying on this page as the service’s official privacy contact.',
        ],
      },
      {
        heading: 'Changes to this policy',
        paragraphs: [
          'This policy may be updated when the service or its data practices change. The effective date shown above identifies the current version on this page.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    introduction:
      'By using Somo File Compression, you agree to use the service responsibly and in accordance with these terms.',
    sections: [
      {
        heading: 'Using the service',
        paragraphs: [
          'Somo File Compression provides PDF compression through an authenticated web application. You must provide accurate account information and keep control of your sign-in credentials. Compression requests are limited to 10 per hour, and each PDF must be no larger than 10 MB. Contact form submissions are limited to five per hour.',
        ],
      },
      {
        heading: 'Your files and permissions',
        paragraphs: [
          'You are responsible for the files you upload and must have the rights and permissions needed to submit and process them. Do not use the service to process unlawful files or to infringe another person’s rights.',
          'Keep your own copy of any file you need. The service may fail to process a file, and no particular compression result or output quality is guaranteed.',
        ],
      },
      {
        heading: 'Processing limitations',
        paragraphs: [
          'Invalid, corrupted, password-protected, or unusually complex PDFs may fail. Processing is subject to technical and resource limits. Do not attempt to bypass upload limits, rate limits, authentication, or other access controls.',
        ],
      },
      {
        heading: 'Acceptable use',
        bullets: [
          'Do not interfere with the operation or security of the website or its backend.',
          'Do not attempt unauthorized access to accounts, systems, or data.',
          'Do not use the service for unlawful activity or to violate another person’s rights.',
          'Do not automate or exceed the published rate limits.',
        ],
      },
      {
        heading: 'Availability and changes',
        paragraphs: [
          'The service may be unavailable, interrupted, or changed as it is maintained. Compression depends on third-party hosting and processing services and may not succeed for every file. No uninterrupted availability is promised.',
          'The service currently has no paid plans or payment processing. This may change; any paid offering would be subject to terms presented at that time.',
        ],
      },
      {
        heading: 'Liability limitations',
        paragraphs: [
          'To the extent permitted by applicable law, Somo File Compression is provided without a guarantee that every file will be processed, that a particular result will be achieved, or that the service will always be available. To the extent permitted by applicable law, the service is not responsible for indirect or consequential loss arising from use of, or inability to use, the service. Nothing in these terms limits liability that cannot lawfully be limited.',
        ],
      },
      {
        heading: 'Updates and contact',
        paragraphs: [
          'These terms may be updated as the service changes. Questions about the terms may be sent through the Contact Us form.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    introduction:
      'This policy describes the browser storage and tracking information confirmed by the current application.',
    sections: [
      {
        heading: 'Authentication storage',
        paragraphs: [
          'Supabase Auth uses persistent browser storage to keep your authentication session between visits. This storage is necessary for the account sign-in experience. It is browser storage and should not be confused with a claim that the service uses a particular cookie.',
        ],
      },
      {
        heading: 'Analytics and advertising',
        paragraphs: [
          'The project code reviewed for this policy does not confirm the use of analytics or advertising cookies or tracking technologies. This statement is limited to the reviewed application; it is not a guarantee about technologies that may be added later or used by hosting and other service providers.',
        ],
      },
      {
        heading: 'Managing browser storage',
        paragraphs: [
          'You can manage or clear stored site data through your browser settings. Clearing authentication storage may sign you out. Other browser settings may affect the operation of the site.',
        ],
      },
      {
        heading: 'Policy updates',
        paragraphs: [
          'This policy will be updated if the site’s use of cookies or similar technologies changes.',
        ],
      },
    ],
  },
  refunds: {
    title: 'Refund & Cancellation Policy',
    introduction:
      'As of 5 November 2026, Somo File Compression has no paid plans, subscriptions, or payment processing.',
    sections: [
      {
        heading: 'Refunds',
        paragraphs: [
          'Because the service does not currently collect payment, there are no purchases to refund.',
        ],
      },
      {
        heading: 'Cancellations',
        paragraphs: [
          'Because the service does not currently offer paid subscriptions, there are no paid subscriptions to cancel.',
        ],
      },
      {
        heading: 'Future paid services',
        paragraphs: [
          'If paid plans or payment processing are introduced, this policy will be updated to explain the applicable cancellation and refund terms before they apply.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [
          'Questions about this policy may be sent through the Contact Us form on the website.',
        ],
      },
    ],
  },
};

export default function LegalPage({
  page,
  onNavigateHome,
}: {
  page: SitePageKey;
  onNavigateHome: () => void;
}) {
  const document = PAGE_DOCUMENTS[page];
  const pageTitle = SITE_PAGE_SEO[page].title;

  return (
    <div className="bg-ink-50/60 py-12 sm:py-16 lg:py-20">
      <div className="container-page">
        <article className="mx-auto max-w-3xl rounded-3xl border border-ink-100 bg-white p-6 shadow-soft sm:p-10 lg:p-12">
          <button
            type="button"
            onClick={onNavigateHome}
            className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the main website
          </button>

          <p className="text-sm font-bold uppercase tracking-wider text-brand-600">
            Somo File Compression
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {pageTitle}
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            Effective date: 5 November 2026
          </p>
          <p className="mt-6 text-base leading-relaxed text-ink-600">
            {document.introduction}
          </p>

          <div className="mt-8 space-y-8">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-bold text-ink-900">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 text-sm leading-7 text-ink-600 sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.contactLink && (
                  <a
                    href="/#contact"
                    className="mt-3 inline-flex rounded-lg font-semibold text-brand-600 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    Contact support
                  </a>
                )}
                {section.bullets && (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-ink-600 sm:text-base">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.faqs && (
                  <dl className="mt-4 space-y-4">
                    {section.faqs.map((faq) => (
                      <div key={faq.question}>
                        <dt className="font-semibold text-ink-800">
                          {faq.question}
                        </dt>
                        <dd className="mt-1 text-sm leading-7 text-ink-600 sm:text-base">
                          {faq.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

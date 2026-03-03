import React from 'react';

interface FooterProps { }

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="mt-12 px-10 border-t border-slate-200 bg-slate-900 py-10 text-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1600px] px-4">
        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h4 className="mb-3 text-lg font-semibold">Heading</h4>
            <p className="text-slate-300">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ac ante mollis quam tristique convallis
            </p>
          </div>
          <div className="lg:col-span-3">
            <h4 className="mt-3 text-lg font-semibold sm:mt-3 lg:mt-0">Links</h4>
            <ul className="mt-2 space-y-2 pl-5 text-slate-300 list-disc">
              <li><a className="hover:underline " href="#">Lorem ipsum</a></li>
              <li><a className="hover:underline" href="#">Nam mauris velit</a></li>
              <li><a className="hover:underline" href="#">Etiam vitae mauris</a></li>
              <li><a className="hover:underline" href="#">Fusce scelerisque</a></li>
              <li><a className="hover:underline" href="#">Sed faucibus</a></li>
              <li><a className="hover:underline" href="#">Mauris efficitur nulla</a></li>
            </ul>
          </div>
          <div className="lg:col-span-3">
            <h4 className="mb-3 mt-4 text-lg font-semibold sm:mt-4 lg:mt-0">Contact</h4>
            <p className="text-slate-300">22, Lorem ipsum dolor, consectetur adipiscing</p>
            <p className="mb-0 text-slate-300 mt-5">(541) 754-3010</p>
            <p className="text-slate-300">info@hsdf.com</p>
          </div>
        </div>
        {/* The following MUST be on every page: license information and link to the repository on gitlab.igem.org */}
        <div className="mt-8 border-t border-slate-700 pt-6">
          <div className="text-slate-300">
            <p className="mb-1 text-s">
              <small>© 2026 - Content on this site is licensed under a <a className="underline decoration-slate-400 underline-offset-4 hover:text-white" href="https://creativecommons.org/licenses/by/4.0/" rel="license">Creative Commons Attribution 4.0 International license</a>.</small>
            </p>
            <p className="text-s">
              <small>The repository used to create this website is available at <a className="underline decoration-slate-400 underline-offset-4 hover:text-white" href="https://github.com/triplepiers/Md-to-iGEM-Wikia">github.com/triplepiers/Md-to-iGEM-Wiki</a>.</small>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

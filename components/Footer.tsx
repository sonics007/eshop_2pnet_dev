import Link from 'next/link';

type FooterLink = {
  label: string;
  value: string;
};

type FooterProps = {
  manualLinks?: FooterLink[];
};

const defaultFooterLinks: FooterLink[] = [
  { label: 'Servis UPS', value: 'https://www.2pnet.cz/servis-ups' },
  { label: 'Klimatizácie', value: 'https://www.2pnet.cz/klimatizace' },
  { label: 'IT infraštruktúra', value: 'https://www.2pnet.cz/servis-it' },
  { label: 'Servisné centrum', value: 'https://www.2pnet.cz/servis-it' },
  {
    label: 'Nahlásiť incident',
    value: 'https://2pnet.eintranet.net/Complaint/AddNewComplaint/180/19/Reklamace/'
  },
  { label: 'Status objednávky', value: 'https://www.2pnet.cz/kontakt' },
  { label: 'O nás', value: 'https://www.2pnet.cz/o-nas' },
  { label: 'Kariéra', value: 'https://www.2pnet.cz/kariera' },
  { label: 'Kontakt', value: 'https://www.2pnet.cz/kontakt' }
];

function chunkLinks(links: FooterLink[], columns: number) {
  const perColumn = Math.ceil(links.length / columns);
  return Array.from({ length: columns }, (_, index) =>
    links.slice(index * perColumn, index * perColumn + perColumn)
  );
}

export function Footer({ manualLinks }: FooterProps) {
  const links = manualLinks?.length ? manualLinks : defaultFooterLinks;
  const columns = chunkLinks(links, 3);

  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">2Pnet s.r.o.</p>
          <p className="mt-2 text-sm text-slate-500">Štefánikova 802, 293 01 Mladá Boleslav</p>
          <p className="text-sm text-slate-500">
            Tel.:{' '}
            <a href="tel:+420490520015" className="font-semibold text-slate-900">
              +420 490 520 015
            </a>
          </p>
          <p className="text-sm text-slate-500">
            <Link href="https://www.2pnet.cz" target="_blank" className="hover:text-slate-900">
              www.2pnet.cz
            </Link>
          </p>
        </div>
        {columns.map(
          (column, columnIndex) =>
            column.length > 0 && (
              <div key={`footer-column-${columnIndex}`}>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Linky</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-500">
                  {column.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.value}
                        target="_blank"
                        className="transition hover:text-slate-900"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
        )}
      </div>
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} 2Pnet s.r.o. | Servis UPS · Klimatizácie · Elektroinštalácie
      </div>
    </footer>
  );
}

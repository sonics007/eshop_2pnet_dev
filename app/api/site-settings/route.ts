import { NextResponse } from 'next/server';
import { readSiteSettings, writeSiteSettings, type SiteSettings } from '@/lib/siteSettings';

type PartialSettings = Partial<SiteSettings> & {
  hero?: Partial<SiteSettings['hero']>;
  links?: Partial<SiteSettings['links']>;
};

export async function GET() {
  const settings = await readSiteSettings();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as PartialSettings;
  const current = await readSiteSettings();

  const nextSettings: SiteSettings = {
    hero: {
      backgroundImage: payload.hero?.backgroundImage ?? current.hero.backgroundImage,
      carouselImages: payload.hero?.carouselImages ?? current.hero.carouselImages,
      title: payload.hero?.title ?? current.hero.title,
      description: payload.hero?.description ?? current.hero.description,
      primaryCtaLabel: payload.hero?.primaryCtaLabel ?? current.hero.primaryCtaLabel,
      primaryCtaLink: payload.hero?.primaryCtaLink ?? current.hero.primaryCtaLink,
      secondaryCtaLabel: payload.hero?.secondaryCtaLabel ?? current.hero.secondaryCtaLabel,
      secondaryCtaLink: payload.hero?.secondaryCtaLink ?? current.hero.secondaryCtaLink,
      highlights: payload.hero?.highlights ?? current.hero.highlights
    },
    links: {
      logoPrimaryLink: payload.links?.logoPrimaryLink ?? current.links.logoPrimaryLink,
      logoAdminLink: payload.links?.logoAdminLink ?? current.links.logoAdminLink,
      footerLinks: payload.links?.footerLinks ?? current.links.footerLinks
    }
  };

  await writeSiteSettings(nextSettings);
  return NextResponse.json(nextSettings);
}

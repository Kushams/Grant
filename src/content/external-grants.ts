/**
 * Independent directory of OTHER organizations' grant programmes. NEN does not run, fund, endorse or decide these.
 * Each entry points to the programme's OFFICIAL page. Add entries only after opening the URL and confirming who runs it.
 * `checked` is the date the link was last confirmed to reach the official site.
 */
export const EXTERNAL_CATEGORIES = ["Education", "Healthcare", "Family & housing", "Small business", "Arts & humanities", "Research", "Find more grants"] as const;
export type ExternalCategory = (typeof EXTERNAL_CATEGORIES)[number];

export type ExternalGrant = {
  slug: string;
  name: string;
  category: ExternalCategory;
  by: string; // who actually offers it
  summary: string;
  audience: string; // who it is generally for (not an eligibility determination)
  url: string; // official page
  checked: string; // ISO date
};

const checked = "2026-10-28";

export const EXTERNAL_GRANTS: ExternalGrant[] = [
  { slug: "federal-pell-grant", name: "Federal Pell Grant", category: "Education", by: "U.S. Department of Education — Federal Student Aid", summary: "Grants for undergraduate students with financial need. They generally do not have to be repaid.", audience: "Undergraduate students", url: "https://studentaid.gov/understand-aid/types/grants/pell", checked },
  { slug: "fseog", name: "Federal Supplemental Educational Opportunity Grant (FSEOG)", category: "Education", by: "U.S. Department of Education — Federal Student Aid", summary: "Grants for undergraduates with exceptional financial need, awarded through participating schools.", audience: "Undergraduate students", url: "https://studentaid.gov/understand-aid/types/grants/fseog", checked },
  { slug: "teach-grant", name: "TEACH Grant", category: "Education", by: "U.S. Department of Education — Federal Student Aid", summary: "Grants for students preparing to teach in high-need fields at schools serving low-income families. It comes with a service requirement.", audience: "Future teachers", url: "https://studentaid.gov/understand-aid/types/grants/teach", checked },
  { slug: "health-center-program", name: "Health Center Program", category: "Healthcare", by: "U.S. Health Resources & Services Administration (HRSA)", summary: "Funding for community health centers that provide care in underserved communities.", audience: "Health organizations (patients receive care through the centers)", url: "https://bphc.hrsa.gov/funding", checked },
  { slug: "nih-grants", name: "NIH Grants and Funding", category: "Research", by: "National Institutes of Health", summary: "Funding for biomedical and health research, mainly for researchers and institutions.", audience: "Researchers and research institutions", url: "https://grants.nih.gov/funding/nih-guide-for-grants-and-contracts", checked },
  { slug: "head-start", name: "Head Start", category: "Family & housing", by: "U.S. Administration for Children and Families — Office of Head Start", summary: "Early childhood education and family support for children from low-income families.", audience: "Families with young children", url: "https://acf.gov/ohs", checked },
  { slug: "liheap", name: "Low Income Home Energy Assistance Program (LIHEAP)", category: "Family & housing", by: "U.S. Administration for Children and Families — Office of Community Services", summary: "Help with home heating and cooling costs. Applications go through state, tribal or local agencies.", audience: "Low-income households", url: "https://acf.gov/ocs/programs/liheap", checked },
  { slug: "tanf", name: "Temporary Assistance for Needy Families (TANF)", category: "Family & housing", by: "U.S. Administration for Children and Families — Office of Family Assistance", summary: "Temporary cash assistance and services for families with children, run through state programmes.", audience: "Families with children", url: "https://acf.gov/ofa/programs/temporary-assistance-needy-families-tanf", checked },
  { slug: "wic", name: "WIC (Special Supplemental Nutrition Program for Women, Infants, and Children)", category: "Family & housing", by: "U.S. Department of Agriculture — Food and Nutrition Service", summary: "Nutrition support for pregnant and postpartum women, infants and young children, through state agencies.", audience: "Pregnant women, new mothers, infants and children under 5", url: "https://www.fns.usda.gov/wic", checked },
  { slug: "housing-choice-vouchers", name: "Housing Choice Voucher Program", category: "Family & housing", by: "U.S. Department of Housing and Urban Development (HUD)", summary: "Rental assistance through local public housing agencies.", audience: "Low-income renters", url: "https://www.hud.gov/helping-americans/housing-choice-vouchers-tenants", checked },
  { slug: "cdbg", name: "Community Development Block Grants (CDBG)", category: "Family & housing", by: "U.S. Department of Housing and Urban Development (HUD)", summary: "Grants to states and local governments for community development. Individuals usually reach these through local government programmes.", audience: "Local governments (and residents through local programmes)", url: "https://www.hud.gov/program_offices/comm_planning/cdbg", checked },
  { slug: "sba-grants", name: "SBA grants and funding programs", category: "Small business", by: "U.S. Small Business Administration", summary: "The SBA’s overview of grants and other funding programmes for small businesses and organizations.", audience: "Small businesses and some nonprofits", url: "https://www.sba.gov/funding-programs/grants", checked },
  { slug: "sbir-sttr", name: "SBIR / STTR", category: "Small business", by: "America’s Seed Fund (SBIR.gov)", summary: "Federal funding for small businesses doing research and development.", audience: "Small technology and research businesses", url: "https://www.sbir.gov", checked },
  { slug: "nea-grants", name: "National Endowment for the Arts Grants", category: "Arts & humanities", by: "National Endowment for the Arts", summary: "Grants for arts projects, organizations and communities.", audience: "Arts organizations and artists (programme dependent)", url: "https://www.arts.gov/grants", checked },
  { slug: "neh-grants", name: "National Endowment for the Humanities Grants", category: "Arts & humanities", by: "National Endowment for the Humanities", summary: "Grants for humanities projects, scholarship, education and public programmes.", audience: "Scholars, institutions and cultural organizations", url: "https://www.neh.gov/grants", checked },
  { slug: "nsf-funding", name: "NSF Funding", category: "Research", by: "National Science Foundation", summary: "Funding for research and education in science and engineering.", audience: "Researchers, educators and institutions", url: "https://www.nsf.gov/funding", checked },
  { slug: "grants-gov", name: "Grants.gov", category: "Find more grants", by: "U.S. federal government", summary: "The central site for finding and applying for federal grant opportunities. Most are for organizations rather than individuals.", audience: "Organizations (and some individuals)", url: "https://www.grants.gov", checked },
  { slug: "usagov-grants", name: "USAGov: Government grants, loans and benefits", category: "Find more grants", by: "USAGov (U.S. General Services Administration)", summary: "A plain-language guide to government grants and benefits, with links to the official programmes.", audience: "Everyone", url: "https://www.usa.gov/grants", checked },
];

export const externalGrantBySlug = (slug: string) => EXTERNAL_GRANTS.find((g) => g.slug === slug);

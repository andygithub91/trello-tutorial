import { startCase } from "lodash";
import { auth } from "@clerk/nextjs";

import { OrgControl } from "./_components/org-control";

export async function generateMetadata() {
  const { orgSlug } = auth();

  return {
    // what's startCase: _.startCase([string='']) // https://lodash.com/docs/#startCase
    // _.startCase('--foo-bar--');
    // => 'Foo Bar'
    // _.startCase('fooBar');
    // => 'Foo Bar'
    // _.startCase('__FOO_BAR__');
    // => 'FOO BAR'
    title: startCase(orgSlug || "organization"),
  };
}

const OrganizationIdLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <OrgControl />
      {children}
    </>
  );
};

export default OrganizationIdLayout;

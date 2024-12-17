"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";

import { NavItem, Organization } from "./nav-item";

interface SidebarProps {
  storageKey?: string;
}

export const Sidebar = ({ storageKey = "t-sidebar-state" }: SidebarProps) => {
  // https://usehooks-ts.com/react-hook/use-local-storage
  // expanded object 會像是 {"organization-id-123": true}
  const [expanded, setExpanded] = useLocalStorage<Record<string, any>>(
    storageKey,
    {}
  );

  const { organization: activeOrganization, isLoaded: isLoadedOrg } =
    useOrganization();

  const { userMemberships, isLoaded: isLoadedOrgList } =
    // useOrganizationList : https://clerk.com/docs/references/react/use-organization-list#use-organization-list-parameters useOrganizationList() accepts a single object with the following properties
    useOrganizationList({
      // userMemberships: https://clerk.com/docs/references/react/use-organization-list#use-organization-list-parameters userMemberships can settrue or an object with any of the properties described in Shared properties. If set to true, all default properties will be used.
      userMemberships: {
        // https://clerk.com/docs/references/react/use-organization-list#shared-properties 無限列表要設置為 infinite: true
        infinite: true,
      },
    });

  // defaultAccordionValue 的作用是遍歷 expanded object ，如果遍歷到的 key-value 的 value 為 ture 就 push 這個 key 進 string[] ，再 return 這個 string[] 。 輸入 {"organization-id-123": true} 的話會輸出 ["organization-id-123"]
  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key);
      }
      return acc;
    },
    []
  );

  const onExpand = (id: string) => {
    // 從 curr 參數可以拿到 expanded
    setExpanded((curr) => ({
      ...curr, // 展開 expanded 物件
      [id]: !expanded[id], // 從參數拿到 id ，再用 !expanded[id] 覆蓋 expanded[id]
    }));
  };

  if (!isLoadedOrg || !isLoadedOrgList || userMemberships.isLoading) {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-10 w-[50%]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <NavItem.Skeleton />
          <NavItem.Skeleton />
          <NavItem.Skeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="font-medium text-xs flex items-center mb-1">
        <span>Workspaces</span>
        <Button
          asChild
          type="button"
          size="icon"
          variant="ghost"
          className="ml-auto"
        >
          <Link href="/select-org">
            <Plus className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValue}
        className="space-y-2"
      >
        {userMemberships.data.map(({ organization }) => (
          <NavItem
            key={organization.id}
            isActive={activeOrganization?.id === organization.id}
            isExpanded={expanded[organization.id]}
            organization={organization as Organization}
            onExpand={onExpand}
          />
        ))}
      </Accordion>
    </>
  );
};

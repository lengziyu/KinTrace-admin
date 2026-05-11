import type {
  GenealogyChartData,
  GenealogyChartIndi,
  GenealogyPerson,
  GenealogyTreeView,
} from "@/types/models";

function sortPeople(people: GenealogyPerson[]) {
  return [...people].sort((left, right) => {
    if (left.generationLevel !== right.generationLevel) {
      return left.generationLevel - right.generationLevel;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function getGenealogySex(gender: GenealogyPerson["gender"]): GenealogyChartIndi["sex"] {
  if (gender === "male") {
    return "M";
  }

  if (gender === "female") {
    return "F";
  }

  return "U";
}

export function buildGenealogyChartData(people: GenealogyPerson[]): GenealogyChartData {
  const sorted = sortPeople(people);
  const childrenByParent = new Map<string, GenealogyPerson[]>();
  const familyIdByPerson = new Map<string, string>();
  const familyIdByChild = new Map<string, string>();
  const spouseMetaByPerson = new Map<
    string,
    { familyId: string; spouseId?: string; spouseName?: string | null; spouseSex: "M" | "F" | "U" }
  >();

  for (const person of sorted) {
    if (!person.parentId) {
      continue;
    }

    const group = childrenByParent.get(person.parentId) ?? [];
    group.push(person);
    childrenByParent.set(person.parentId, group);
  }

  const fams = sorted
    .map((person) => {
      const children = childrenByParent.get(person.id) ?? [];
      const spouseName = person.spouseName?.trim();

      if (children.length === 0 && !spouseName) {
        return null;
      }

      const familyId = `gene-fam-${person.id}`;
      const spouseId = spouseName ? `gene-spouse-${person.id}` : undefined;
      familyIdByPerson.set(person.id, familyId);
      spouseMetaByPerson.set(person.id, {
        familyId,
        spouseId,
        spouseName,
        spouseSex:
          person.gender === "male"
            ? "F"
            : person.gender === "female"
              ? "M"
              : "U",
      });

      for (const child of children) {
        familyIdByChild.set(child.id, familyId);
      }

      if (person.gender === "female") {
        return {
          id: familyId,
          wife: person.id,
          husb: spouseId,
          children: children.map((child) => child.id),
        };
      }

      return {
        id: familyId,
        husb: person.id,
        wife: spouseId,
        children: children.map((child) => child.id),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const indis: GenealogyChartIndi[] = sorted.map((person) => ({
    id: person.id,
    firstName: person.name,
    lastName: [person.generationLabel, person.branchName].filter(Boolean).join(" · ") || undefined,
    famc: familyIdByChild.get(person.id),
    fams: familyIdByPerson.has(person.id) ? [familyIdByPerson.get(person.id)!] : undefined,
    sex: getGenealogySex(person.gender),
    hideId: true,
    hideSex: person.gender === "unknown",
  }));

  const spouseIndis: GenealogyChartIndi[] = sorted
    .map((person) => {
      const spouseMeta = spouseMetaByPerson.get(person.id);
      if (!spouseMeta?.spouseId || !spouseMeta.spouseName) {
        return null;
      }

      return {
        id: spouseMeta.spouseId,
        firstName: spouseMeta.spouseName,
        lastName: "配偶",
        fams: [spouseMeta.familyId],
        sex: spouseMeta.spouseSex,
        hideId: true,
        hideSex: spouseMeta.spouseSex === "U",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    indis: [...indis, ...spouseIndis],
    fams,
  };
}

export function buildGenealogyTreeView(familyId: string, people: GenealogyPerson[]): GenealogyTreeView {
  const sorted = sortPeople(people);

  return {
    familyId,
    people: sorted,
    chartData: buildGenealogyChartData(sorted),
    startIndiId: sorted.find((item) => !item.parentId)?.id ?? sorted[0]?.id ?? null,
  };
}

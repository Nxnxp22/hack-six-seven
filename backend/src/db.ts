import { prisma } from './prisma.js';

// ─── decoding_rules ───────────────────────────────────────────────────────────

export const getRulesFromDB = (difficulty: string) =>
  prisma.decodingRule.findMany({
    where: { difficulty },
    orderBy: { rule_number: 'asc' },
  });

export const getAllRulesFromDB = () =>
  prisma.decodingRule.findMany({
    orderBy: [{ difficulty: 'asc' }, { rule_number: 'asc' }],
  });

export const getRuleByIdFromDB = (id: number) =>
  prisma.decodingRule.findUnique({ where: { id } });

export const createRuleInDB = async (
  difficulty: string,
  rule_number: number,
  description: string,
): Promise<number> => {
  const row = await prisma.decodingRule.create({
    data: { difficulty, rule_number, description },
  });
  return row.id;
};

export const updateRuleInDB = (
  id: number,
  difficulty: string,
  rule_number: number,
  description: string,
) =>
  prisma.decodingRule.update({
    where: { id },
    data: { difficulty, rule_number, description },
  });

export const deleteRuleFromDB = (id: number) =>
  prisma.decodingRule.delete({ where: { id } });

// ─── critical_templates ───────────────────────────────────────────────────────

export const getCriticalTemplateFromDB = async (difficulty: string): Promise<string> => {
  const row = await prisma.criticalTemplate.findUnique({
    where: { difficulty },
    select: { template: true },
  });
  return row?.template ?? '';
};

export const getCriticalTemplateByDifficultyFromDB = (difficulty: string) =>
  prisma.criticalTemplate.findUnique({ where: { difficulty } });

export const getAllCriticalTemplatesFromDB = () =>
  prisma.criticalTemplate.findMany({
    orderBy: { difficulty: 'asc' },
  });

export const getCriticalTemplateByIdFromDB = (id: number) =>
  prisma.criticalTemplate.findUnique({ where: { id } });

export const createCriticalTemplateInDB = async (
  difficulty: string,
  template: string,
): Promise<number> => {
  const row = await prisma.criticalTemplate.create({
    data: { difficulty, template },
  });
  return row.id;
};

export const updateCriticalTemplateInDB = (
  id: number,
  difficulty: string,
  template: string,
) =>
  prisma.criticalTemplate.update({
    where: { id },
    data: { difficulty, template },
  });

export const deleteCriticalTemplateFromDB = (id: number) =>
  prisma.criticalTemplate.delete({ where: { id } });

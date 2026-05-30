import { prisma } from '../src/prisma.js';

const rules = [
  { difficulty: 'EASY', rule_number: 1, description: 'If there is a RED wire, out the RED wire.' },
  { difficulty: 'EASY', rule_number: 2, description: 'Otherwise, if the last wire is BLUE, cut the BLUE wire.' },
  { difficulty: 'EASY', rule_number: 3, description: 'Otherwise, cut the 1st (top) wire.' },
  { difficulty: 'MEDIUM', rule_number: 1, description: 'If there is a YELLOW wire, cut it. Otherwise, cut the 3rd (middle) wire.' },
  { difficulty: 'MEDIUM', rule_number: 2, description: 'If the last wire is GREEN, cut the last wire. Otherwise, cut the 1st wire.' },
  { difficulty: 'MEDIUM', rule_number: 3, description: 'If both rules point to the same wire, cut the last wire instead for the 2nd target.' },
  { difficulty: 'HARD', rule_number: 1, description: 'Cut the GREEN wire if present. Otherwise, cut the 1st wire.' },
  { difficulty: 'HARD', rule_number: 2, description: 'If there is a CYAN wire, cut it. Otherwise, cut the 4th (middle) wire.' },
  { difficulty: 'HARD', rule_number: 3, description: 'If the last wire is ORANGE or PURPLE, cut the last wire. Otherwise, cut the 2nd wire.' },
  { difficulty: 'HARD', rule_number: 4, description: 'If any rule targets a wire already cut, cut the next available wire down.' },
];

const templates = [
  { difficulty: 'EASY', template: 'CRITICAL: Cut the {color} wire to restore power.' },
  { difficulty: 'MEDIUM', template: 'CRITICAL: System breach. Override sequence hex signatures: {hex1} -> {hex2}.' },
  { difficulty: 'HARD', template: 'CRITICAL: Nexus lock active. Mainframe defusal signatures sequence: {name1} -> {name2} -> {name3}.' },
];

async function main() {
  const ruleCount = await prisma.decodingRule.count();
  if (ruleCount === 0) {
    await prisma.decodingRule.createMany({ data: rules });
    console.log('Seeded decoding_rules');
  }

  for (const t of templates) {
    await prisma.criticalTemplate.upsert({
      where: { difficulty: t.difficulty },
      create: t,
      update: {},
    });
  }
  console.log('Seeded critical_templates');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

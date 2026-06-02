import 'dotenv/config';
import prisma from '../config/database.js';

const GOALS = [
  {
    title: 'Morning workout',
    description: '30 min cardio + stretching before the day starts',
    startTime: '06:00', endTime: '07:00',
    isWeekdayGoal: true, isWeekendGoal: false,
  },
  {
    title: 'Read technical book',
    description: 'Designing Data-Intensive Applications — 20 pages per session',
    startTime: '07:00', endTime: '07:30',
    isWeekdayGoal: true, isWeekendGoal: false,
  },
  {
    title: 'Deep work block',
    description: 'No Slack, no meetings — focused coding on hardest problem of the day',
    startTime: '09:00', endTime: '11:00',
    isWeekdayGoal: true, isWeekendGoal: false,
  },
  {
    title: 'Lunch walk',
    description: 'Step outside, clear the head, 20 min minimum',
    startTime: '13:00', endTime: '13:30',
    isWeekdayGoal: false, isWeekendGoal: false,
  },
  {
    title: 'Evening review',
    description: 'Review what got done, update tasks, write 3 wins for the day',
    startTime: '20:00', endTime: '20:30',
    isWeekdayGoal: true, isWeekendGoal: false,
  },
  {
    title: 'Language learning',
    description: 'Duolingo + 10 min conversation practice or shadowing',
    startTime: '07:30', endTime: '08:00',
    isWeekdayGoal: false, isWeekendGoal: false,
  },
  {
    title: 'Meditation',
    description: 'Headspace or silent sit — no phone, no exceptions',
    startTime: '05:45', endTime: '06:00',
    isWeekdayGoal: false, isWeekendGoal: false,
  },
  {
    title: 'Side project coding',
    description: 'Ruthless-execution feature work or portfolio projects',
    startTime: '21:00', endTime: '22:30',
    isWeekdayGoal: false, isWeekendGoal: false,
  },
  {
    title: 'Weekend long run',
    description: 'At least 8km — trail or road, pace does not matter',
    startTime: '08:00', endTime: '09:30',
    isWeekdayGoal: false, isWeekendGoal: true,
  },
  {
    title: 'Weekly review & planning',
    description: 'Review last week metrics, set goals for next week, update backlog',
    startTime: '10:00', endTime: '11:00',
    isWeekdayGoal: false, isWeekendGoal: true,
  },
];

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('No user found in DB. Start the backend and log in at least once first.');
    process.exit(1);
  }

  const existing = await prisma.goal.count({ where: { userId: user.id } });
  if (existing >= 10) {
    console.log(`User ${user.email} already has ${existing} goals — skipping seed.`);
    return;
  }

  const targetEndDate = '2026-08-31';
  let created = 0;

  for (const g of GOALS) {
    const [sh, sm] = g.startTime.split(':').map(Number);
    const [eh, em] = g.endTime.split(':').map(Number);
    const allocatedMinutes = (eh * 60 + em) - (sh * 60 + sm);

    await prisma.goal.create({
      data: {
        userId: user.id,
        title: g.title,
        description: g.description,
        startTime: g.startTime,
        endTime: g.endTime,
        allocatedMinutes,
        isWeekdayGoal: g.isWeekdayGoal,
        isWeekendGoal: g.isWeekendGoal,
        tags: [],
        targetEndDate,
      },
    });
    console.log(`  ✓ ${g.title}`);
    created++;
  }

  console.log(`\nCreated ${created} goals for ${user.email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

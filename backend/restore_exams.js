const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
    try {
        console.log('--- Restoring Exam Levels ---');

        const organizer = await prisma.organizer.findUnique({
            where: { email: 'CIET2026@gmail.com' }
        });

        if (!organizer) {
            console.error('Organizer CIET2026@gmail.com not found. Please register first.');
            return;
        }

        const exams = [
            {
                title: 'Easy',
                code: 'EASY-START',
                sequence: 1,
                description: 'Beginner level questions',
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            },
            {
                title: 'Medium',
                code: 'MED-NEXT',
                sequence: 2,
                description: 'Intermediate level questions',
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            {
                title: 'Hard',
                code: 'HARD-FINAL',
                sequence: 3,
                description: 'Advanced level questions',
                startTime: new Date(),
                endTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        ];

        for (const examData of exams) {
            const exam = await prisma.exam.create({
                data: {
                    ...examData,
                    organizerId: organizer.id
                }
            });
            console.log(`Created Exam: ${exam.title} (${exam.code})`);
        }

        console.log('--- Restoration Complete ---');
        console.log('NOTE: Questions for these exams are still missing and must be recreated.');
    } catch (error) {
        console.error('Restoration Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restore();

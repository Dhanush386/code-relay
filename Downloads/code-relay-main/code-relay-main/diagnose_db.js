const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log('--- DB DIAGNOSTICS ---');

        const participants = await prisma.participant.findMany({ take: 5 });
        console.log('Participants (Top 5):');
        participants.forEach(p => console.log(`  ID: ${p.id}, TeamName: ${p.participantId}`));

        const exams = await prisma.exam.findMany({
            include: { _count: { select: { questions: true } } }
        });
        console.log('\nExams:');
        exams.forEach(e => {
            console.log(`  ID: ${e.id}, Title: ${e.title}, Question Count: ${e._count.questions}`);
        });

        if (exams.length > 0) {
            const firstExam = await prisma.exam.findFirst({
                include: { questions: { select: { id: true, title: true } } }
            });
            console.log(`\nQuestions in Exam "${firstExam.title}":`);
            firstExam.questions.forEach(q => console.log(`  QID: ${q.id}, Title: ${q.title}`));
        }

    } catch (e) {
        console.error('Error during diagnostics:', e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();

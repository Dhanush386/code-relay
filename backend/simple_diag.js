const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DB DIAGNOSTICS ---');
        const questions = await prisma.question.findMany({
            select: { id: true, examId: true, title: true }
        });

        const exams = await prisma.exam.findMany({
            select: { id: true, title: true }
        });

        console.log('\nExams & Question Counts:');
        exams.forEach(e => {
            const count = questions.filter(q => q.examId === e.id).length;
            console.log(`  Exam ID: ${e.id}, Title: ${e.title}, Questions: ${count}`);
        });

        const participants = await prisma.participant.findMany({ take: 5, select: { id: true, participantId: true } });
        console.log('\nSample Participants:');
        participants.forEach(p => console.log(`  ID: ${p.id}, Team: ${p.participantId}`));

    } catch (e) {
        console.error('Error during diagnostics:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();

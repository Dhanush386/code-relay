const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const questions = await prisma.question.findMany({
            select: { id: true, examId: true, title: true }
        });
        console.log('--- ALL QUESTIONS ---');
        questions.forEach(q => console.log(`ID: ${q.id}, ExamID: ${q.examId}, Title: ${q.title}`));

        const exams = await prisma.exam.findMany({
            select: { id: true, title: true }
        });
        console.log('\n--- EXAMS ---');
        exams.forEach(e => {
            const count = questions.filter(q => q.examId === e.id).length;
            console.log(`ID: ${e.id}, Title: ${e.title}, Question Count: ${count}`);
        });

        const participants = await prisma.participant.findMany({ take: 3 });
        console.log('\n--- SAMPLE PARTICIPANTS ---');
        participants.forEach(p => console.log(`ID: ${p.id}, Name: ${p.participantId}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

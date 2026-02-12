const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        console.log('--- VERIFYING ASSIGNMENT LOGIC ---');

        // 1. Find an exam with at least 2 questions
        const exams = await prisma.exam.findMany({
            include: { _count: { select: { questions: true } } }
        });
        const suitableExam = exams.find(e => e._count.questions >= 2);

        if (!suitableExam) {
            console.log('No exam with at least 2 questions found. Test might be limited.');
            return;
        }

        console.log(`Testing with Exam: ${suitableExam.title} (ID: ${suitableExam.id})`);

        // 2. Find/Create two participants
        let p1 = await prisma.participant.findFirst({ where: { participantId: 'test_p1' } });
        if (!p1) p1 = await prisma.participant.create({ data: { participantId: 'test_p1' } });

        let p2 = await prisma.participant.findFirst({ where: { participantId: 'test_p2' } });
        if (!p2) p2 = await prisma.participant.create({ data: { participantId: 'test_p2' } });

        console.log(`Participants: P1(ID:${p1.id}), P2(ID:${p2.id})`);

        // 3. Simulated assignment logic (simplified from route)
        async function getAssignedQuestion(participantId, examId) {
            let assignment = await prisma.questionAssignment.findUnique({
                where: { participantId_examId: { participantId, examId } }
            });

            if (assignment) return assignment.questionId;

            const available = await prisma.question.findMany({ where: { examId }, select: { id: true } });
            const picked = available[Math.floor(Math.random() * available.length)].id;

            await prisma.questionAssignment.create({
                data: { participantId, examId, questionId: picked }
            });
            return picked;
        }

        const q1_first = await getAssignedQuestion(p1.id, suitableExam.id);
        const q1_second = await getAssignedQuestion(p1.id, suitableExam.id);

        console.log(`P1: First call -> ${q1_first}, Second call -> ${q1_second}`);
        if (q1_first === q1_second) {
            console.log('✅ P1 Persistence verified.');
        } else {
            console.log('❌ P1 Persistence failed!');
        }

        const q2 = await getAssignedQuestion(p2.id, suitableExam.id);
        console.log(`P2 Assigned Question: ${q2}`);

        // Note: they might get the same question by chance if the pool is small (1/N chance)
        // but we verify that the assignments exist in the DB.

        const count = await prisma.questionAssignment.count({
            where: { examId: suitableExam.id }
        });
        console.log(`Total assignments in DB for this exam: ${count}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

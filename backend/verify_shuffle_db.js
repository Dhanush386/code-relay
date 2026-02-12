const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The logic from participantRoutes.js
const seededRandom = (s) => {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 0x517cc1b7);
    }
    return () => {
        h = Math.imul(h ^ (h >>> 16), 0x22468225);
        h = Math.imul(h ^ (h >>> 13), 0x3266489a);
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
};

function shuffleQuestions(questions, participantId, examId) {
    const seedStr = `${participantId}-${examId}`;
    const rng = seededRandom(seedStr);
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function verify() {
    try {
        const exam = await prisma.exam.findFirst({
            include: { questions: true }
        });

        if (!exam) {
            console.log('No exams found.');
            return;
        }

        const questions = exam.questions;
        if (questions.length < 2) {
            console.log(`Exam "${exam.title}" only has ${questions.length} questions. Shuffling won't do much.`);
            return;
        }

        console.log(`Exam: ${exam.title} (ID: ${exam.id})`);
        console.log(`Question IDs: ${questions.map(q => q.id).join(', ')}`);

        for (let pId of [1, 2, 3, 4, 5]) {
            const shuffled = shuffleQuestions(questions, pId, exam.id);
            console.log(`Participant ${pId}: [${shuffled.map(q => q.id).join(', ')}]`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

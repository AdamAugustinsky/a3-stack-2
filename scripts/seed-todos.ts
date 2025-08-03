import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/lib/server/db/schema';

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const db = drizzle(DATABASE_URL, { schema });

async function main() {
	console.log('🌱 Starting todo seeding...');

	// Fix the sequence to start from the next available ID
	console.log('🔧 Fixing ID sequence...');
	await db.execute(
		sql`SELECT setval('todo_id_seq', COALESCE((SELECT MAX(id) FROM todo), 0) + 1, false);`
	);

	const tasks = [
		{ text: 'Review and approve pull request #123', label: 'feature' as const },
		{ text: 'Fix infinite loading spinner on login page', label: 'bug' as const },
		{ text: 'Update API documentation for v2.0', label: 'documentation' as const },
		{ text: 'Implement dark mode toggle functionality', label: 'feature' as const },
		{ text: 'Resolve 500 error when uploading large files', label: 'bug' as const },
		{ text: 'Write deployment guide for production', label: 'documentation' as const },
		{ text: 'Optimize database queries for better performance', label: 'feature' as const },
		{ text: 'Fix validation error messages not showing', label: 'bug' as const },
		{ text: 'Create troubleshooting guide for common issues', label: 'documentation' as const },
		{ text: 'Add search functionality to the admin panel', label: 'feature' as const },
		{ text: 'Implement email notification system', label: 'feature' as const },
		{ text: 'Fix memory leak in background tasks', label: 'bug' as const },
		{ text: 'Document API authentication flow', label: 'documentation' as const },
		{ text: 'Add user profile management', label: 'feature' as const },
		{ text: 'Resolve CORS issues in development', label: 'bug' as const },
		{ text: 'Create setup guide for new developers', label: 'documentation' as const },
		{ text: 'Implement real-time notifications', label: 'feature' as const },
		{ text: 'Fix dropdown positioning on mobile', label: 'bug' as const },
		{ text: 'Update README with latest changes', label: 'documentation' as const },
		{ text: 'Add data export functionality', label: 'feature' as const },
		{ text: 'Fix timezone display issues', label: 'bug' as const },
		{ text: 'Write user manual for admin features', label: 'documentation' as const },
		{ text: 'Implement two-factor authentication', label: 'feature' as const },
		{ text: 'Resolve broken links in emails', label: 'bug' as const },
		{ text: 'Create architecture decision records', label: 'documentation' as const }
	];

	const statuses = ['todo', 'in progress', 'done', 'backlog', 'canceled'] as const;
	const priorities = ['low', 'medium', 'high'] as const;

	// Get current month date range for spreading dates (up to today)
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
	const today = new Date(); // Max date is today

	function getRandomDateInMonth(): Date {
		const randomTime = firstDay.getTime() + Math.random() * (today.getTime() - firstDay.getTime());
		return new Date(randomTime);
	}

	// Insert 25 todos
	for (const task of tasks) {
		const status = statuses[Math.floor(Math.random() * statuses.length)];
		const priority = priorities[Math.floor(Math.random() * priorities.length)];
		const completed = Math.random() < 0.3;
		const createdAt = getRandomDateInMonth();
		const updatedAt = getRandomDateInMonth();

		await db.insert(schema.todo).values({
			text: task.text,
			completed,
			label: task.label,
			status,
			priority,
			createdAt,
			updatedAt
		});
	}

	console.log('✅ Todo seeding completed successfully!');
	console.log('📊 Generated 25 realistic todo tasks spread throughout the current month');

	process.exit(0);
}

main().catch((error) => {
	console.error('❌ Seeding failed:', error);
	process.exit(1);
});

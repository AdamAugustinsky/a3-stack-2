import { query } from '$app/server';
import { eden } from '$lib/server/eden';
import { error } from '@sveltejs/kit';

// Dashboard statistics query
export const getDashboardStats = query(async () => {
	const response = await eden.api.dashboard.stats.get();

	if (response.error) {
		error(500, 'Failed to fetch dashboard stats');
	}

	return response.data;
});

// Recent todos activity (for charts)
export const getRecentActivity = query(async () => {
	const response = await eden.api.dashboard.activity.get();

	if (response.error) {
		error(500, 'Failed to fetch activity data');
	}

	return response.data;
});

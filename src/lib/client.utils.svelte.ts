import { goto } from '$app/navigation';
import { page } from '$app/state';

export function navigateTo(path: string) {
	goto('/' + page.params.organization_slug + path);
}

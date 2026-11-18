import { createAtom } from '@tanstack/store';
import { useAtom, useSelector } from '@tanstack/react-store';

export const pageEditModeAtom = createAtom(false);

export function usePageEditMode(): boolean {
    return useSelector(pageEditModeAtom);
}

export function usePageEditModeToggle(): [boolean, () => void] {
    const [enabled, setEnabled] = useAtom(pageEditModeAtom);

    return [enabled, () => setEnabled(!enabled)];
}

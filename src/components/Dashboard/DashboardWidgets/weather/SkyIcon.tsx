import {
    CloudFogIcon,
    CloudIcon,
    CloudLightningIcon,
    CloudMoonIcon,
    CloudRainIcon,
    CloudSnowIcon,
    CloudSunIcon,
    DropIcon,
    MoonIcon,
    SunIcon,
} from '@phosphor-icons/react';

import { skyKind } from './weather';

export default function SkyIcon({
    code,
    isDay,
    size = 18,
}: {
    code: number;
    isDay: boolean;
    size?: number;
}) {
    switch (skyKind(code)) {
        case 'clear':
            return isDay ? <SunIcon size={size} /> : <MoonIcon size={size} />;
        case 'mostly_clear':
        case 'partly_cloudy':
            return isDay ? (
                <CloudSunIcon size={size} />
            ) : (
                <CloudMoonIcon size={size} />
            );
        case 'overcast':
            return <CloudIcon size={size} />;
        case 'fog':
            return <CloudFogIcon size={size} />;
        case 'drizzle':
        case 'freezing_drizzle':
            return <DropIcon size={size} />;
        case 'rain':
        case 'freezing_rain':
        case 'showers':
            return <CloudRainIcon size={size} />;
        case 'snow':
        case 'snow_showers':
            return <CloudSnowIcon size={size} />;
        case 'thunderstorm':
            return <CloudLightningIcon size={size} />;
        case 'unknown':
            return <CloudIcon size={size} />;
    }
}

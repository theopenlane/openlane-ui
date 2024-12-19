export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
    blue: {
        bg: "bg-blue-400",
        stroke: "stroke-blue-400",
        fill: "fill-blue-400",
        text: "text-blue-400",
    },
    saffron: {
        bg: "bg-saffron-500",
        stroke: "stroke-saffron-500",
        fill: "fill-saffron-500",
        text: "text-saffron-500",
    },
    jade: {
        bg: "bg-jade-500",
        stroke: "stroke-jade-500",
        fill: "fill-jade-500",
        text: "text-jade-500",
    },
    pink: {
        bg: "bg-pink-500",
        stroke: "stroke-pink-500",
        fill: "fill-pink-500",
        text: "text-pink-500",
    },
    purple: {
        bg: "bg-purple-500",
        stroke: "stroke-purple-500",
        fill: "fill-purple-500",
        text: "text-purple-500",
    },
    red: {
        bg: "bg-red-500",
        stroke: "stroke-red-500",
        fill: "fill-red-500",
        text: "text-red-500",
    },
    grey: {
        bg: "bg-gray-500",
        stroke: "stroke-gray-500",
        fill: "fill-gray-500",
        text: "text-gray-500",
    },
} as const satisfies {
    [color: string]: {
        [key in ColorUtility]: string
    }
}

export type AvailableChartColorsKeys = keyof typeof chartColors

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
    chartColors,
) as Array<AvailableChartColorsKeys>

export const constructCategoryColors = (
    categories: string[],
    colors: AvailableChartColorsKeys[],
): Map<string, AvailableChartColorsKeys> => {
    const categoryColors = new Map<string, AvailableChartColorsKeys>()
    categories.forEach((category, index) => {
        categoryColors.set(category, colors[index % colors.length])
    })
    return categoryColors
}

export const getColorClassName = (
    color: AvailableChartColorsKeys,
    type: ColorUtility,
): string => {
    const fallbackColor = {
        bg: "bg-blue-500",
        stroke: "stroke-blue-500",
        fill: "fill-blue-500",
        text: "text-blue-500",
    }
    return chartColors[color]?.[type] ?? fallbackColor[type]
}

export const getYAxisDomain = (
    autoMinValue: boolean,
    minValue: number | undefined,
    maxValue: number | undefined,
) => {
    const minDomain = autoMinValue ? "auto" : minValue ?? 0
    const maxDomain = maxValue ?? "auto"
    return [minDomain, maxDomain]
}

export function hasOnlyOneValueForKey(
    array: any[],
    keyToCheck: string,
): boolean {
    const val: any[] = []

    for (const obj of array) {
        if (Object.prototype.hasOwnProperty.call(obj, keyToCheck)) {
            val.push(obj[keyToCheck])
            if (val.length > 1) {
                return false
            }
        }
    }

    return true
}
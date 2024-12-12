export type ColorUtility = "bg" | "stroke" | "fill" | "text"

export const chartColors = {
    aquamarine: {
        bg: "bg-aquamarine-500",
        stroke: "stroke-aquamarine-500",
        fill: "fill-aquamarine-500",
        text: "text-aquamarine-500",
    },
    saffron: {
        bg: "bg-saffron-500",
        stroke: "stroke-saffron-500",
        fill: "fill-saffron-500",
        text: "text-saffron-500",
    },
    firefly: {
        bg: "bg-firefly-500",
        stroke: "stroke-firefly-500",
        fill: "fill-firefly-500",
        text: "text-firefly-500",
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
        bg: "bg-gray-500",
        stroke: "stroke-gray-500",
        fill: "fill-gray-500",
        text: "text-gray-500",
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
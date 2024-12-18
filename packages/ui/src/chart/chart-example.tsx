import { LineChart, TooltipProps } from "./chart"
import { cn } from "@repo/ui/lib/utils"

interface Issue {
    status: "completed" | "in progress" | "on hold"
    value: number
    percentage: number
}

interface DataEntry {
    date: string
    issues: Issue[]
}

const data: DataEntry[] = [
    //array-start
    {
        date: "Jun 1, 24",
        issues: [
            {
                status: "completed",
                value: 47,
                percentage: 24.2,
            },
            {
                status: "in progress",
                value: 83,
                percentage: 41.9,
            },
            {
                status: "on hold",
                value: 67,
                percentage: 33.9,
            },
        ],
    },
    {
        date: "Jun 2, 24",
        issues: [
            {
                status: "completed",
                value: 20,
                percentage: 20.6,
            },
            {
                status: "in progress",
                value: 97,
                percentage: 77.3,
            },
            {
                status: "on hold",
                value: 12,
                percentage: 2.1,
            },
        ],
    },
    {
        date: "Jun 3, 24",
        issues: [
            {
                status: "completed",
                value: 30,
                percentage: 29.4,
            },
            {
                status: "in progress",
                value: 45,
                percentage: 43.1,
            },
            {
                status: "on hold",
                value: 66,
                percentage: 27.5,
            },
        ],
    },
    {
        date: "Jun 4, 24",
        issues: [
            {
                status: "completed",
                value: 41,
                percentage: 28.1,
            },
            {
                status: "in progress",
                value: 18,
                percentage: 17.9,
            },
            {
                status: "on hold",
                value: 70,
                percentage: 54.0,
            },
        ],
    },
    {
        date: "Jun 5, 24",
        issues: [
            {
                status: "completed",
                value: 55,
                percentage: 28.8,
            },
            {
                status: "in progress",
                value: 14,
                percentage: 25.0,
            },
            {
                status: "on hold",
                value: 60,
                percentage: 46.2,
            },
        ],
    },
    {
        date: "Jun 6, 24",
        issues: [
            {
                status: "completed",
                value: 35,
                percentage: 28.8,
            },
            {
                status: "in progress",
                value: 14,
                percentage: 19.2,
            },
            {
                status: "on hold",
                value: 80,
                percentage: 51.9,
            },
        ],
    },
    {
        date: "Jun 7, 24",
        issues: [
            {
                status: "completed",
                value: 15,
                percentage: 20.0,
            },
            {
                status: "in progress",
                value: 55,
                percentage: 35.2,
            },
            {
                status: "on hold",
                value: 72,
                percentage: 44.8,
            },
        ],
    },
    {
        date: "Jun 8, 24",
        issues: [
            {
                status: "completed",
                value: 15,
                percentage: 21.7,
            },
            {
                status: "in progress",
                value: 69,
                percentage: 48.2,
            },
            {
                status: "on hold",
                value: 45,
                percentage: 30.1,
            },
        ],
    },
    //array-end
]

// Transform data into a format suitable for LineChart
const formattedArray = data.map((entry) => {
    return {
        date: entry.date,
        ...entry.issues.reduce(
            (acc, issue) => {
                acc[issue.status] = issue.value
                return acc
            },
            {} as { [key in Issue["status"]]?: number },
        ),
    }
})

const valueFormatter = (number: number) => {
    return Intl.NumberFormat("us").format(number).toString()
}

const status = {
    completed: "bg-jade-500 dark:bg-jade-500",
    "in progress": "bg-mauve-400 dark:bg-mauve-400",
    "on hold": "bg-saffron-500 dark:bg-saffron-500",
}

const Tooltip = ({ payload, active, label }: TooltipProps) => {
    if (!active || !payload || payload.length === 0) return null

    const data = payload.map((item) => ({
        status: item.category as Issue["status"],
        value: item.value,
        percentage: (
            (item.value /
                (item.payload.completed +
                    item.payload["in progress"] +
                    item.payload["on hold"])) *
            100
        ).toFixed(2),
    }))

    return (
        <>
            <div className="w-60 rounded-md border border-gray-500/10 bg-blue-500 px-4 py-1.5 text-sm shadow-md dark:border-gray-400/20 dark:bg-gray-900">
                <p className="flex items-center justify-between">
                    <span className="text-gray-50 dark:text-gray-50">Date</span>
                    <span className="font-medium text-gray-50 dark:text-gray-50">
                        {label}
                    </span>
                </p>
            </div>
            <div className="mt-1 w-60 space-y-1 rounded-md border border-gray-500/10 bg-white px-4 py-2 text-sm shadow-md dark:border-gray-400/20 dark:bg-gray-900">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2.5">
                        <span
                            className={cn(
                                status[item.status],
                                "size-2.5 shrink-0 rounded-sm",
                            )}
                            aria-hidden={true}
                        />
                        <div className="flex w-full justify-between">
                            <span className="text-gray-700 dark:text-gray-300">
                                {item.status}
                            </span>
                            <div className="flex items-center space-x-1">
                                <span className="font-medium text-gray-900 dark:text-gray-50">
                                    {item.value}
                                </span>
                                <span className="text-gray-500 dark:text-gray-500">
                                    ({item.percentage}&#37;)
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}

export function LineChartExample() {
    return (
        <div>
            <LineChart
                className="h-64"
                data={formattedArray}
                index="date"
                categories={["completed", "in progress", "on hold"]}
                colors={["jade", "mauve", "saffron"]}
                valueFormatter={valueFormatter}
                yAxisWidth={35}
                showLegend={true}
                customTooltip={Tooltip}
            />
        </div>
    )
}
"use client"

import React from "react"
import { Pie, PieChart } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./Card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    type ChartConfig,
} from "./chart"

const chartConfig = {
    amount: {
        label: "Valor",
    },
    recebido: {
        label: "Recebido",
        color: "#10b981",
    },
    areceber: {
        label: "Fiado",
        color: "#3b82f6",
    },
} satisfies ChartConfig

export function ChartPieLegend({ recebido, aReceber }: { recebido: number, aReceber: number }) {
    const chartData = [
        { status: "recebido", amount: recebido || 1, fill: "var(--color-recebido)" },
        { status: "areceber", amount: aReceber || 0, fill: "var(--color-areceber)" },
    ];

    return (
        <Card className="flex flex-col flex-1 w-full md:basis-[48%] md:min-w-[280px]">
            <CardHeader className="items-center pb-0">
                <CardTitle>Composição da Receita</CardTitle>
                <CardDescription>Recebido vs Fiado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[300px]"
                >
                    <PieChart>
                        <Pie data={chartData} dataKey="amount" nameKey="status" />
                        <ChartLegend
                            content={(props: any) => <ChartLegendContent {...props} nameKey="status" />}
                            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}

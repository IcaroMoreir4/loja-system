"use client"

import React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./Card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "./chart"

const chartConfig = {
    amount: {
        label: "Valor",
        color: "#3b82f6",
    },
} satisfies ChartConfig

export function ChartBarLabel({ totalMes }: { totalMes: number }) {
    const chartData = [
        { month: "Sem 1", amount: totalMes * 0.2 },
        { month: "Sem 2", amount: totalMes * 0.3 },
        { month: "Sem 3", amount: totalMes * 0.1 },
        { month: "Sem 4", amount: totalMes * 0.4 },
    ]

    return (
        <Card className="flex flex-col flex-1 w-full md:basis-[48%] md:min-w-[280px] mb-4">
            <CardHeader>
                <CardTitle>Desempenho de Vendas</CardTitle>
                <CardDescription>Janeiro - Junho 2024</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 5)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={(props: any) => (
                                <ChartTooltipContent
                                    {...props}
                                    hideLabel
                                    formatter={(value: number, name: string) => (
                                        <>
                                            <span className="text-muted-foreground">{name}</span>
                                            <span className="font-mono font-medium tabular-nums text-foreground">
                                                {Number(value).toFixed(2)}
                                            </span>
                                        </>
                                    )}
                                />
                            )}
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={8}>
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                                formatter={(value: any) => Number(value ?? 0).toFixed(2)}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Crescendo 5.2% este mês <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Mostrando receita total dos últimos meses
                </div>
            </CardFooter>
        </Card>
    )
}

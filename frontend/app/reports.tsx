import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ChartBarLabel } from '../components/ui/ChartBar';
import { ChartPieLegend } from '../components/ui/ChartPie';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';
import { api } from '../services/api';
// @ts-ignore - UMD build avoids tslib runtime issue in Expo Web
import * as PDFLib from 'pdf-lib/dist/pdf-lib.min.js';

type SaleRecord = {
    product_id: number;
    quantity: number;
    total_value: number;
    sale_date: string;
    payment_methods?: { method: string; amount: number }[];
};

type ProductRecord = {
    id: number;
    name: string;
    variation?: string | null;
};

type ProductSummary = {
    name: string;
    quantity: number;
    total: number;
};

type SalesReportData = {
    startDate: string;
    endDate: string;
    totalRevenue: number;
    totalSales: number;
    ticketMedio: number;
    totalReceived: number;
    totalFiado: number;
    products: ProductSummary[];
};

export default function ReportsScreen() {
    const { dashboard, pendingCredits, fetchDashboard, fetchPendingCredits, isLoading } = useStore();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboard();
        fetchPendingCredits();
    }, [fetchDashboard, fetchPendingCredits]);

    const onRefresh = () => {
        fetchDashboard();
        fetchPendingCredits();
    };

    const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;
    const parseLocalInputDate = (dateText: string, endOfDay = false) => {
        const [year, month, day] = dateText.split('-').map(Number);
        if (!year || !month || !day) {
            return new Date(dateText);
        }
        if (endOfDay) {
            return new Date(year, month - 1, day, 23, 59, 59, 999);
        }
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    };
    const formatDateBr = (inputDate: string) => {
        const d = parseLocalInputDate(inputDate);
        return d.toLocaleDateString('pt-BR');
    };

    const getPendingTotal = () => {
        return pendingCredits.reduce((acc, curr) => acc + (curr.total_value - curr.paid_amount), 0);
    };

    const buildSalesReportData = (sales: SaleRecord[], products: ProductRecord[], initialDate: string, finalDate: string): SalesReportData => {
        const sDate = parseLocalInputDate(initialDate);
        const eDate = parseLocalInputDate(finalDate, true);

        const filteredSales = sales.filter((sale) => {
            const saleDate = new Date(sale.sale_date);
            return saleDate >= sDate && saleDate <= eDate;
        });

        if (filteredSales.length === 0) {
            throw new Error('Nenhuma venda encontrada para o período selecionado.');
        }

        const productMap = new Map<number, ProductRecord>();
        products.forEach((product) => productMap.set(product.id, product));

        const byProduct = new Map<string, ProductSummary>();
        let totalRevenue = 0;
        let totalReceived = 0;
        let totalFiado = 0;
        const totalSales = filteredSales.length;

        filteredSales.forEach((sale) => {
            totalRevenue += Number(sale.total_value || 0);

            const paymentMethods = Array.isArray(sale.payment_methods) ? sale.payment_methods : [];
            if (paymentMethods.length > 0) {
                paymentMethods.forEach((payment) => {
                    const amount = Number(payment.amount || 0);
                    if (String(payment.method || '').toUpperCase() === 'FIADO') {
                        totalFiado += amount;
                    } else {
                        totalReceived += amount;
                    }
                });
            } else {
                totalReceived += Number(sale.total_value || 0);
            }

            const product = productMap.get(sale.product_id);
            const productName = product
                ? `${product.name}${product.variation ? ` (${product.variation})` : ''}`
                : `Produto #${sale.product_id}`;

            const current = byProduct.get(productName) || { name: productName, quantity: 0, total: 0 };
            current.quantity += Number(sale.quantity || 0);
            current.total += Number(sale.total_value || 0);
            byProduct.set(productName, current);
        });

        const productsSummary = Array.from(byProduct.values()).sort((a, b) => b.total - a.total);
        const ticketMedio = totalSales > 0 ? totalRevenue / totalSales : 0;

        return {
            startDate: initialDate,
            endDate: finalDate,
            totalRevenue,
            totalSales,
            ticketMedio,
            totalReceived,
            totalFiado,
            products: productsSummary,
        };
    };

    const generateSalesPdf = async (report: SalesReportData) => {
        const { PDFDocument, StandardFonts, rgb } = PDFLib as any;
        const pdfDoc = await PDFDocument.create();
        const pageSize: [number, number] = [595, 842];
        let page = pdfDoc.addPage(pageSize);
        const [pageWidth, pageHeight] = pageSize;
        const margin = 40;
        const contentWidth = pageWidth - margin * 2;
        const tableInset = 8;
        const tableX = margin + tableInset;
        const tableWidth = contentWidth - tableInset * 2;
        const tableWidths = [
            Math.round(tableWidth * 0.62),
            Math.round(tableWidth * 0.16),
            tableWidth - Math.round(tableWidth * 0.62) - Math.round(tableWidth * 0.16),
        ];
        const rowHeight = 26;
        const headerBg = rgb(0.96, 0.96, 0.97);
        const borderSoft = rgb(0.86, 0.87, 0.89);
        const textMain = rgb(0.08, 0.09, 0.11);
        const textMuted = rgb(0.35, 0.38, 0.42);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        let y = pageHeight - margin;

        const drawTextAt = (text: string, x: number, yPos: number, size = 11, bold = false, color = textMain) => {
            page.drawText(text, {
                x,
                y: yPos,
                size,
                font: bold ? fontBold : fontRegular,
                color,
            });
        };

        const drawCenteredTextAt = (text: string, centerX: number, yPos: number, size = 11, bold = false, color = textMain) => {
            const font = bold ? fontBold : fontRegular;
            const textWidth = font.widthOfTextAtSize(text, size);
            drawTextAt(text, centerX - textWidth / 2, yPos, size, bold, color);
        };

        const drawRightTextAt = (text: string, rightX: number, yPos: number, size = 11, bold = false, color = textMain) => {
            const font = bold ? fontBold : fontRegular;
            const textWidth = font.widthOfTextAtSize(text, size);
            drawTextAt(text, rightX - textWidth, yPos, size, bold, color);
        };

        const moveDown = (height: number) => {
            y -= height;
        };

        const ensureSpace = (needed: number) => {
            if (y - needed < margin + 14) {
                page = pdfDoc.addPage(pageSize);
                y = pageHeight - margin;
            }
        };

        drawCenteredTextAt('RELATÓRIO DE VENDAS', pageWidth / 2, y, 22, true);
        moveDown(28);
        page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 1,
            color: borderSoft,
        });
        moveDown(20);

        const periodBoxHeight = 54;
        ensureSpace(periodBoxHeight + 28);
        page.drawRectangle({
            x: margin,
            y: y - periodBoxHeight,
            width: contentWidth,
            height: periodBoxHeight,
            color: rgb(0.985, 0.987, 0.99),
            borderWidth: 1,
            borderColor: borderSoft,
        });
        drawTextAt('PERÍODO DO RELATÓRIO', margin + 14, y - 18, 10, true, textMuted);
        drawTextAt(`${formatDateBr(report.startDate)} até ${formatDateBr(report.endDate)}`, margin + 14, y - 38, 12, false, textMain);
        moveDown(periodBoxHeight + 28);

        ensureSpace(180);
        drawTextAt('RESUMO DO PERÍODO', margin, y, 13, true);
        moveDown(14);
        const summaryRows: [string, string][] = [
            ['Faturamento total', formatCurrency(report.totalRevenue)],
            ['Total de vendas realizadas', String(report.totalSales)],
            ['Ticket médio', formatCurrency(report.ticketMedio)],
            ['Total recebido', formatCurrency(report.totalReceived)],
            ['Total fiado', formatCurrency(report.totalFiado)],
        ];

        const summaryPaddingTop = 14;
        const summaryLineHeight = 20;
        const summaryPaddingBottom = 12;
        const summaryBoxHeight = summaryPaddingTop + summaryRows.length * summaryLineHeight + summaryPaddingBottom;
        page.drawRectangle({
            x: margin,
            y: y - summaryBoxHeight,
            width: contentWidth,
            height: summaryBoxHeight,
            color: rgb(0.995, 0.995, 0.997),
            borderWidth: 1,
            borderColor: borderSoft,
        });

        const labelX = margin + 14;
        const valueRightX = pageWidth - margin - 14;
        let summaryY = y - summaryPaddingTop - 2;
        summaryRows.forEach(([label, value]) => {
            drawTextAt(`${label}:`, labelX, summaryY, 11, true);
            drawRightTextAt(value, valueRightX, summaryY, 11, false);
            summaryY -= summaryLineHeight;
        });

        moveDown(summaryBoxHeight + 28);
        ensureSpace(80);
        drawTextAt('PRODUTOS VENDIDOS', margin, y, 13, true);
        moveDown(20);

        const drawTableHeader = () => {
            const rowTop = y;
            const textY = rowTop - 18;
            page.drawRectangle({
                x: tableX,
                y: rowTop - rowHeight,
                width: tableWidths[0],
                height: rowHeight,
                color: headerBg,
                borderWidth: 1,
                borderColor: borderSoft,
            });
            page.drawRectangle({
                x: tableX + tableWidths[0],
                y: rowTop - rowHeight,
                width: tableWidths[1],
                height: rowHeight,
                color: headerBg,
                borderWidth: 1,
                borderColor: borderSoft,
            });
            page.drawRectangle({
                x: tableX + tableWidths[0] + tableWidths[1],
                y: rowTop - rowHeight,
                width: tableWidths[2],
                height: rowHeight,
                color: headerBg,
                borderWidth: 1,
                borderColor: borderSoft,
            });
            drawTextAt('Produto', tableX + 10, textY, 10, true);
            drawCenteredTextAt('Quantidade', tableX + tableWidths[0] + tableWidths[1] / 2, textY, 10, true);
            drawRightTextAt('Valor Total', tableX + tableWidths[0] + tableWidths[1] + tableWidths[2] - 10, textY, 10, true);
            moveDown(rowHeight);
        };

        drawTableHeader();

        report.products.forEach((item, idx) => {
            ensureSpace(rowHeight + 32);
            if (y - rowHeight < margin + 20) {
                page = pdfDoc.addPage(pageSize);
                y = pageHeight - margin;
                drawTableHeader();
            }
            const rowTop = y;
            const textY = rowTop - 18;
            const rawName = String(item.name);
            const truncatedName = rawName.length > 58 ? `${rawName.slice(0, 55)}...` : rawName;

            page.drawRectangle({
                x: tableX,
                y: rowTop - rowHeight,
                width: tableWidths[0],
                height: rowHeight,
                borderWidth: 1,
                borderColor: borderSoft,
                color: idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.99, 0.99, 0.995),
            });
            page.drawRectangle({
                x: tableX + tableWidths[0],
                y: rowTop - rowHeight,
                width: tableWidths[1],
                height: rowHeight,
                borderWidth: 1,
                borderColor: borderSoft,
                color: idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.99, 0.99, 0.995),
            });
            page.drawRectangle({
                x: tableX + tableWidths[0] + tableWidths[1],
                y: rowTop - rowHeight,
                width: tableWidths[2],
                height: rowHeight,
                borderWidth: 1,
                borderColor: borderSoft,
                color: idx % 2 === 0 ? rgb(1, 1, 1) : rgb(0.99, 0.99, 0.995),
            });

            drawTextAt(truncatedName, tableX + 10, textY, 10, false);
            drawCenteredTextAt(String(item.quantity), tableX + tableWidths[0] + tableWidths[1] / 2, textY, 10, false);
            drawRightTextAt(formatCurrency(item.total), tableX + tableWidths[0] + tableWidths[1] + tableWidths[2] - 10, textY, 10, false);
            moveDown(rowHeight);
        });

        const footerDate = new Date().toLocaleString('pt-BR');
        ensureSpace(76);
        moveDown(20);
        page.drawLine({
            start: { x: margin, y },
            end: { x: pageWidth - margin, y },
            thickness: 1,
            color: borderSoft,
        });
        moveDown(18);
        drawTextAt(`Relatório gerado em: ${footerDate}`, margin, y, 10, false, textMuted);
        moveDown(14);
        drawTextAt('Sistema: Loula Control', margin, y, 10, false, textMuted);
        moveDown(14);
        page.drawLine({
            start: { x: margin, y: y },
            end: { x: pageWidth - margin, y: y },
            thickness: 1,
            color: borderSoft,
        });

        const pdfBytes = await pdfDoc.save();
        const fileName = `relatorio-vendas-${report.startDate}-ate-${report.endDate}.pdf`;
        const arrayBuffer = new ArrayBuffer(pdfBytes.length);
        new Uint8Array(arrayBuffer).set(pdfBytes);
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const generatePDF = async () => {
        try {
            setIsGenerating(true);
            if (!startDate || !endDate) {
                setAlertMessage('Selecione data inicial e data final para gerar o relatório.');
                return;
            }
            if (parseLocalInputDate(startDate) > parseLocalInputDate(endDate)) {
                setAlertMessage('A data final deve ser posterior à data inicial.');
                return;
            }
            if (Platform.OS !== 'web') {
                setAlertMessage('A geração de PDF por download automático está disponível no navegador web.');
                return;
            }

            const [{ data: sales }, { data: products }] = await Promise.all([
                api.get('/sales/'),
                api.get('/products/'),
            ]);

            const reportData = buildSalesReportData(sales, products, startDate, endDate);
            await generateSalesPdf(reportData);
            setAlertMessage('PDF gerado e download iniciado.');
        } catch (e: any) {
            console.error(e);
            setAlertMessage(e?.message || 'Erro ao gerar PDF.');
        } finally {
            setIsGenerating(false);
        }
    };

    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ padding: isMobile ? 12 : 24, paddingBottom: 64 }}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Relatórios & Análises</Text>
                <Text style={styles.subtitle}>Janeiro - Junho 2024</Text>
            </View>

            <View style={[styles.grid, isMobile && styles.gridMobile]}>
                <ChartBarLabel totalMes={dashboard?.total_sold_month || 0} />
                <ChartPieLegend recebido={dashboard?.total_sold_month || 1} aReceber={getPendingTotal() || 0} />

                {/* Summary Mini Cards */}
                <Card style={isMobile ? ({ ...styles.cardMini, ...styles.cardMiniMobile } as any) : styles.cardMini}>
                    <CardHeader style={styles.cardHeaderRowMini}>
                        <CardTitle style={styles.cardTitle}>Lucro Bruto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text style={[styles.cardValue, { color: '#16a34a' }]}>{formatCurrency(dashboard?.profit_month || 0)}</Text>
                    </CardContent>
                </Card>

                <Card style={isMobile ? ({ ...styles.cardMini, ...styles.cardMiniMobile } as any) : styles.cardMini}>
                    <CardHeader style={styles.cardHeaderRowMini}>
                        <CardTitle style={styles.cardTitle}>Total a Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Text style={[styles.cardValue, { color: '#ef4444' }]}>{formatCurrency(getPendingTotal())}</Text>
                    </CardContent>
                </Card>

            </View>

            {/* Configuração de Relatório PDF */}
            <Card style={styles.pdfCard}>
                <CardHeader>
                    <CardTitle style={styles.cardTitle}>Gerar Relatório de Vendas (PDF)</CardTitle>
                    <Text style={{ color: '#71717a', marginTop: 4 }}>Defina data inicial e final para gerar o PDF consolidado de vendas.</Text>
                </CardHeader>
                <CardContent>
                    <View style={isMobile ? { flexDirection: 'column', gap: 12 } : { flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#09090b', marginBottom: 6 }}>Data Inicial</Text>
                            {Platform.OS === 'web' ? (
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    style={{ height: 48, width: '100%', borderRadius: 8, border: `1px solid ${startDate && endDate && (new Date(startDate) > new Date(endDate)) ? '#ef4444' : '#e4e4e7'}`, padding: '0 16px', fontSize: 16, outline: 'none', color: '#09090b', boxSizing: 'border-box' }}
                                />
                            ) : (
                                <Input type="date" placeholder="Ex: 01/05/2024" value={startDate} onChangeText={setStartDate} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '500', color: '#09090b', marginBottom: 6 }}>Data Final</Text>
                            {Platform.OS === 'web' ? (
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    style={{ height: 48, width: '100%', borderRadius: 8, border: `1px solid ${startDate && endDate && (new Date(startDate) > new Date(endDate)) ? '#ef4444' : '#e4e4e7'}`, padding: '0 16px', fontSize: 16, outline: 'none', color: '#09090b', boxSizing: 'border-box' }}
                                />
                            ) : (
                                <Input type="date" placeholder="Ex: 31/05/2024" value={endDate} onChangeText={setEndDate} />
                            )}
                        </View>
                        <View style={{ flex: 1, justifyContent: 'flex-end', width: isMobile ? '100%' : undefined }}>
                            {(!startDate || !endDate) && (
                                <Text style={{ color: '#71717a', fontSize: 12, marginBottom: 8 }}>
                                    Preencha as duas datas para liberar a geração do PDF.
                                </Text>
                            )}
                            {startDate && endDate && (new Date(startDate) > new Date(endDate)) && (
                                <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 8, fontWeight: 'bold' }}>A Data Final deve ser posterior à Inicial.</Text>
                            )}
                            <Button 
                                title={isGenerating ? "Gerando..." : "Gerar Relatório"} 
                                onPress={generatePDF} 
                                style={{ height: 48, backgroundColor: '#3b82f6', marginBottom: isMobile ? 8 : 4, width: isMobile ? '100%' : undefined }} 
                                disabled={isGenerating || !startDate || !endDate || (new Date(startDate) > new Date(endDate))} 
                            />
                        </View>
                    </View>
                </CardContent>
            </Card>

            {/* Soft Alert Modal */}
            <ResponsiveModal
                visible={!!alertMessage}
                onRequestClose={() => setAlertMessage(null)}
                title="Atenção"
                titleColor="#dc2626"
                footer={<Button title="Entendi" onPress={() => setAlertMessage(null)} style={{ backgroundColor: '#3b82f6', width: '100%' }} />}
            >
                <Text style={{ fontSize: 16, color: '#3f3f46', lineHeight: 22 }}>{alertMessage}</Text>
            </ResponsiveModal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f5' },
    contentContainer: { padding: 24, paddingBottom: 64 },

    header: { marginBottom: 24 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
    gridMobile: { flexDirection: 'column', flexWrap: 'nowrap', gap: 12 },
    cardLarge: { flexGrow: 1, minWidth: 280, maxWidth: '100%', flexBasis: '45%' },
    cardMini: { flexGrow: 1, minWidth: 150, maxWidth: '100%', flexBasis: '20%' },
    cardMiniMobile: { width: '100%', minWidth: '100%', flexBasis: '100%' },

    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8 },
    cardDesc: { fontSize: 14, color: '#71717a', marginTop: 2 },
    cardHeaderRowMini: { paddingBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#09090b' },
    cardValue: { fontSize: 24, fontWeight: 'bold', letterSpacing: -0.5 },

    pdfCard: { marginTop: 16, backgroundColor: '#ffffff' },

    modalOverlay: {  },

    footerRow: { width: '100%', paddingHorizontal: 24, paddingBottom: 24, marginTop: 12 },
    trendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    trendingText: { fontSize: 14, fontWeight: '500', color: '#09090b' },
    footerSubText: { fontSize: 14, color: '#71717a' }
});

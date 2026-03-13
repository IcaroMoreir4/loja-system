import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, useWindowDimensions, Modal, Platform } from 'react-native';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ChartBarLabel } from '../components/ui/ChartBar';
import { ChartPieLegend } from '../components/ui/ChartPie';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type SaleRecord = {
    product_id: number;
    quantity: number;
    total_value: number;
    sale_date: string;
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
    }, []);

    const onRefresh = () => {
        fetchDashboard();
        fetchPendingCredits();
    };

    const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;
    const formatDateBr = (isoDate: string) => {
        const d = new Date(isoDate);
        return d.toLocaleDateString('pt-BR');
    };

    const getPendingTotal = () => {
        return pendingCredits.reduce((acc, curr) => acc + (curr.total_value - curr.paid_amount), 0);
    };

    const buildSalesReportData = (sales: SaleRecord[], products: ProductRecord[], initialDate: string, finalDate: string): SalesReportData => {
        const sDate = new Date(initialDate);
        sDate.setHours(0, 0, 0, 0);
        const eDate = new Date(finalDate);
        eDate.setHours(23, 59, 59, 999);

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
        const totalSales = filteredSales.length;

        filteredSales.forEach((sale) => {
            totalRevenue += Number(sale.total_value || 0);
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
            products: productsSummary,
        };
    };

    const buildSalesReportHtml = (report: SalesReportData) => {
        const rows = report.products
            .map(
                (item) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>R$ ${item.total.toFixed(2).replace('.', ',')}</td>
                </tr>
            `
            )
            .join('');

        return `
            <html>
                <head>
                    <meta charset="utf-8" />
                    <style>
                        body { font-family: Arial, sans-serif; padding: 32px; color: #18181b; }
                        h1 { margin: 0 0 12px 0; font-size: 28px; }
                        .periodo { margin-bottom: 24px; color: #3f3f46; font-size: 14px; }
                        .resumo { margin-bottom: 24px; }
                        .resumo h2 { margin: 0 0 10px 0; font-size: 18px; }
                        .resumo p { margin: 4px 0; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                        th, td { border: 1px solid #e4e4e7; padding: 10px; text-align: left; font-size: 13px; }
                        th { background: #f4f4f5; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Vendas</h1>
                    <div class="periodo">Período: ${formatDateBr(report.startDate)} até ${formatDateBr(report.endDate)}</div>

                    <div class="resumo">
                        <h2>Resumo</h2>
                        <p><strong>Faturamento total:</strong> R$ ${report.totalRevenue.toFixed(2).replace('.', ',')}</p>
                        <p><strong>Total de vendas:</strong> ${report.totalSales}</p>
                        <p><strong>Ticket médio:</strong> R$ ${report.ticketMedio.toFixed(2).replace('.', ',')}</p>
                    </div>

                    <h2 style="font-size: 18px; margin-bottom: 8px;">Tabela de produtos vendidos</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Produto</th>
                                <th>Quantidade vendida</th>
                                <th>Total vendido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </body>
            </html>
        `;
    };

    const downloadPdfWeb = (uri: string, filename: string) => {
        const link = document.createElement('a');
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = async () => {
        try {
            setIsGenerating(true);
            if (!startDate || !endDate) {
                setAlertMessage('Selecione data inicial e data final para gerar o relatório.');
                return;
            }
            if (new Date(startDate) > new Date(endDate)) {
                setAlertMessage('A data final deve ser posterior à data inicial.');
                return;
            }

            const [{ data: sales }, { data: products }] = await Promise.all([
                api.get('/sales/'),
                api.get('/products/'),
            ]);

            const reportData = buildSalesReportData(sales, products, startDate, endDate);
            const html = buildSalesReportHtml(reportData);
            const { uri } = await Print.printToFileAsync({ html });

            if (Platform.OS === 'web' && typeof document !== 'undefined') {
                downloadPdfWeb(uri, `relatorio-vendas-${startDate}-ate-${endDate}.pdf`);
                setAlertMessage('PDF gerado e download iniciado.');
                return;
            }

            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                await Sharing.shareAsync(uri);
            } else {
                await Print.printAsync({ html });
            }
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
            <Modal visible={!!alertMessage} transparent={true} animationType="fade">
                <View style={[styles.modalOverlay, { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16, zIndex: 9999 }]}>
                    <Card style={{ padding: isMobile ? 20 : 32, width: '100%', maxWidth: 400, backgroundColor: '#fff', alignItems: 'flex-start' }}>
                        <Text style={[{ color: '#09090b', marginBottom: 16, fontSize: 18, fontWeight: 'bold' }]}>Aviso do Relatório</Text>
                        <Text style={{ fontSize: 16, color: '#3f3f46', marginBottom: 40, lineHeight: 22 }}>{alertMessage}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', width: '100%' }}>
                            <Button title="Entendi" onPress={() => setAlertMessage(null)} style={{ backgroundColor: '#3b82f6', width: isMobile ? '100%' : undefined }} />
                        </View>
                    </Card>
                </View>
            </Modal>

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

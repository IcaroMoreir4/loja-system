import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';

export default function CreditsScreen() {
    const { products, fetchProducts, fetchDashboard } = useStore();
    const [credits, setCredits] = useState<any[]>([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<any>(null);

    const [payAmount, setPayAmount] = useState('');

    // Soft Alert State
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        fetchProducts();
        fetchCredits();
    }, [fetchProducts]);

    const fetchCredits = async () => {
        try {
            const { data } = await api.get('/credits/');
            setCredits(data);
        } catch { }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PAID': return <Badge variant="success">PAGO</Badge>;
            case 'PARTIAL': return <Badge variant="outline" textStyle={{ color: '#f59e0b' }}>PARCIAL</Badge>;
            default: return <Badge variant="destructive">PENDENTE</Badge>;
        }
    };

    const formatCurrency = (val: number) => `R$ ${Number(val).toFixed(2).replace('.', ',')}`;

    const openPayModal = (credit: any) => {
        setSelectedCredit(credit);
        const remaining = credit.total_value - credit.paid_amount;
        setPayAmount(remaining.toFixed(2));
        setModalVisible(true);
    };

    const submitPayment = async () => {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) {
            setAlertMessage('Informe um valor válido.');
            return;
        }

        try {
            await api.post(`/credits/${selectedCredit.id}/payments`, {
                amount: amount,
                payment_method: 'CASH' // default, can add options later
            });
            setModalVisible(false);
            fetchCredits();
            fetchDashboard();
            setAlertMessage('Pagamento registrado com sucesso!');
        } catch (e: any) {
            setAlertMessage(e.response?.data?.detail || 'Erro ao registrar pagamento');
        }
    };

    const undoPayment = async (paymentId: number) => {
        setConfirmAction({
            message: 'Tem certeza que deseja desfazer/estornar este pagamento?',
            onConfirm: async () => {
                try {
                    await api.delete(`/credits/payments/${paymentId}`);
                    fetchCredits();
                    fetchDashboard();
                } catch {
                    setAlertMessage('Erro ao estornar pagamento');
                }
                setConfirmAction(null);
            }
        });
    };

    const deleteCreditCard = async (id: number) => {
        setConfirmAction({
            message: 'ATENÇÃO: Isso apagará completamente o registro do fiado e retornará o item ao estoque.\n\nContinuar?',
            onConfirm: async () => {
                try {
                    await api.delete(`/credits/${id}`);
                    fetchCredits();
                    fetchProducts();
                    fetchDashboard();
                } catch {
                    setAlertMessage('Erro ao excluir');
                }
                setConfirmAction(null);
            }
        });
    };

    const renderCreditItem = ({ item }: { item: any }) => {
        const prod = products.find(p => p.id === item.product_id);
        const prodName = prod ? prod.name : 'Venda Genérica';
        const remaining = item.total_value - item.paid_amount;

        const cardStyleObj = item.status !== 'PAID' ? { ...styles.card, ...styles.cardDanger } : styles.card;

        return (
            <Card style={cardStyleObj as any}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                    {getStatusBadge(item.status)}
                </View>
                <CardContent style={{ padding: 16, paddingTop: 0 }}>
                    <Text style={styles.detailText}>{prodName} (x{item.quantity})</Text>
                    <View style={[styles.metricsRow, isMobile && { flexDirection: 'column', gap: 10 }]}>
                        <View>
                            <Text style={styles.metricLabel}>Total</Text>
                            <Text style={styles.metricValue}>{formatCurrency(item.total_value)}</Text>
                        </View>
                        <View>
                            <Text style={styles.metricLabel}>Pago</Text>
                            <Text style={[styles.metricValue, { color: '#16a34a' }]}>{formatCurrency(item.paid_amount)}</Text>
                        </View>
                        <View>
                            <Text style={styles.metricLabel}>Restante</Text>
                            <Text style={[styles.metricValue, { color: '#ef4444' }]}>{formatCurrency(remaining)}</Text>
                        </View>
                    </View>

                    <Text style={styles.dateText}>{new Date(item.sale_date).toLocaleDateString()}</Text>

                    {item.payments && item.payments.length > 0 && (
                        <View style={styles.paymentsList}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Histórico de Pagamentos</Text>
                            {item.payments.map((p: any) => (
                                <View key={p.id} style={styles.paymentItem}>
                                    <Text style={{ fontSize: 12 }}>{new Date(p.payment_date).toLocaleDateString()} - {formatCurrency(p.amount)}</Text>
                                    <Button variant="ghost" title="x Estornar" textStyle={{ fontSize: 10, color: '#ef4444' }} style={{ paddingVertical: 2, paddingHorizontal: 4, backgroundColor: '#fef2f2' }} onPress={() => undoPayment(p.id)} />
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={[styles.actionsRow, isMobile && { flexDirection: 'column', gap: 8 }]}>
                        {item.status !== 'PAID' && (
                            <Button style={{ flex: 1, marginRight: isMobile ? 0 : 8, backgroundColor: '#3b82f6', width: isMobile ? '100%' : undefined }} title="Receber Parte/Tudo" onPress={() => openPayModal(item)} />
                        )}
                        <Button title="Apagar Fiado" onPress={() => deleteCreditCard(item.id)} style={{ backgroundColor: '#dc2626', width: isMobile ? '100%' : undefined }} />
                    </View>
                </CardContent>
            </Card>
        );
    };

    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Fiados e Dívidas</Text>
                <Text style={styles.subtitle}>Gerencie recebimentos a prazo ou fracionados.</Text>
            </View>

            <FlatList
                data={credits}
                keyExtractor={item => String(item.id)}
                renderItem={renderCreditItem}
                contentContainerStyle={{ padding: isMobile ? 12 : 24, paddingBottom: 64 }}
            />

            <ResponsiveModal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                title={selectedCredit ? selectedCredit.customer_name : 'Receber Pagamento'}
                centeredContent
                footer={
                    <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12, width: '100%' }}>
                        <Button variant="outline" onPress={() => setModalVisible(false)} title="Cancelar" style={{ flex: 1, width: isMobile ? '100%' : undefined }} />
                        <Button onPress={submitPayment} title="Confirmar" style={{ flex: 1, backgroundColor: '#16a34a', width: isMobile ? '100%' : undefined }} />
                    </View>
                }
            >
                {selectedCredit && (
                    <>
                        <Text style={{ marginBottom: 20, fontSize: 16, textAlign: 'center', color: '#3f3f46' }}>
                            Restante a pagar: <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(selectedCredit.total_value - selectedCredit.paid_amount)}</Text>
                        </Text>
                        <View style={{ width: '100%' }}>
                            <Input label="Valor do Pagamento Agora (R$)" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
                        </View>
                    </>
                )}
            </ResponsiveModal>

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

            {/* Soft Confirm Modal */}
            <ResponsiveModal
                visible={!!confirmAction}
                onRequestClose={() => setConfirmAction(null)}
                title="Confirmação de Cancelamento"
                titleColor="#dc2626"
                centeredContent
                footer={
                    <View style={{ flexDirection: isMobile ? 'column' : 'row', width: '100%', gap: 12 }}>
                        <Button title="Cancelar" variant="outline" onPress={() => setConfirmAction(null)} style={{ width: isMobile ? '100%' : undefined, flex: 1 }} />
                        <Button title="Sim, confirmar" onPress={confirmAction ? confirmAction.onConfirm : () => {}} style={{ backgroundColor: '#dc2626', width: isMobile ? '100%' : undefined, flex: 1 }} />
                    </View>
                }
            >
                <Text style={{ fontSize: 16, color: '#3f3f46', lineHeight: 22, textAlign: 'center' }}>
                    {confirmAction?.message || 'Tem certeza que deseja cancelar? Você perderá todas as alterações realizadas.'}
                </Text>
            </ResponsiveModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f5' },
    header: { padding: 24, paddingBottom: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e4e4e7' },
    title: { fontSize: 28, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    card: { marginBottom: 16 },
    cardDanger: { borderColor: '#fca5a5' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
    customerName: { fontSize: 18, fontWeight: 'bold', color: '#09090b' },
    detailText: { fontSize: 14, color: '#71717a', marginBottom: 12 },

    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f4f4f5', padding: 12, borderRadius: 8, marginBottom: 12 },
    metricLabel: { fontSize: 12, color: '#a1a1aa' },
    metricValue: { fontSize: 16, fontWeight: 'bold', color: '#09090b' },

    dateText: { fontSize: 12, color: '#a1a1aa', marginBottom: 12 },

    paymentsList: { backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, marginBottom: 12 },
    paymentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 },

    actionsRow: { flexDirection: 'row', marginTop: 4 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalCard: { width: '100%', maxWidth: 400, padding: 32, backgroundColor: '#fff' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b', marginBottom: 8, textAlign: 'center' },
    modalActions: { flexDirection: 'row', marginTop: 16 }
});

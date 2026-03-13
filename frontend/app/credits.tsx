import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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
    }, []);

    const fetchCredits = async () => {
        try {
            const { data } = await api.get('/credits/');
            setCredits(data);
        } catch (error) { }
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
                } catch (e) {
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
                } catch (e) {
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

            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={[styles.modalOverlay, { zIndex: 999 }]}>
                    <Card style={{ ...styles.modalCard as any, maxWidth: 400, alignItems: 'center', padding: isMobile ? 20 : 32 }}>
                        {selectedCredit && (
                            <>
                                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>{selectedCredit.customer_name}</Text>
                                <Text style={{ marginBottom: 40, fontSize: 16, textAlign: 'center' }}>
                                    Restante a pagar: <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(selectedCredit.total_value - selectedCredit.paid_amount)}</Text>
                                </Text>

                                <View style={{ width: '100%', marginBottom: 16 }}>
                                    <Input label="Valor do Pagamento Agora (R$)" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
                                </View>

                                <View style={[styles.modalActions, { justifyContent: 'space-between', gap: 12, width: '100%', marginTop: 24, flexDirection: isMobile ? 'column' : 'row' }]}>
                                    <Button variant="outline" onPress={() => setModalVisible(false)} title="Cancelar" style={{ flex: 1, width: isMobile ? '100%' : undefined }} />
                                    <Button onPress={submitPayment} title="Confirmar" style={{ flex: 1, backgroundColor: '#16a34a', width: isMobile ? '100%' : undefined }} />
                                </View>
                            </>
                        )}
                    </Card>
                </View>
            </Modal>

            {/* Soft Alert Modal */}
            <Modal visible={!!alertMessage} transparent={true} animationType="fade">
                <View style={[styles.modalOverlay, { zIndex: 9999 }]}>
                    <Card style={{ ...styles.modalCard as any, maxWidth: 400, alignItems: 'flex-start', padding: isMobile ? 20 : 32 }}>
                        <Text style={[{ color: '#09090b', marginBottom: 16, fontSize: 18, fontWeight: 'bold' }]}>Aviso</Text>
                        <Text style={{ fontSize: 16, color: '#3f3f46', marginBottom: 40, lineHeight: 22 }}>{alertMessage}</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', width: '100%' }}>
                            <Button title="Entendi" onPress={() => setAlertMessage(null)} style={{ backgroundColor: '#3b82f6', width: isMobile ? '100%' : undefined }} />
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Soft Confirm Modal */}
            <Modal visible={!!confirmAction} transparent={true} animationType="fade">
                <View style={[styles.modalOverlay, { zIndex: 9999 }]}>
                    <Card style={{ ...styles.modalCard as any, maxWidth: 400, alignItems: 'flex-start', padding: isMobile ? 20 : 32 }}>
                        <Text style={[{ color: '#09090b', marginBottom: 16, fontSize: 18, fontWeight: 'bold' }]}>Confirmação</Text>
                        <Text style={{ fontSize: 16, color: '#3f3f46', marginBottom: 40, lineHeight: 22 }}>{confirmAction?.message}</Text>
                        <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-start', width: '100%', gap: 12 }}>
                            <Button title="Cancelar" variant="outline" onPress={() => setConfirmAction(null)} style={{ width: isMobile ? '100%' : undefined }} />
                            <Button title="Sim, confirmar" onPress={confirmAction ? confirmAction.onConfirm : () => {}} style={{ backgroundColor: '#dc2626', width: isMobile ? '100%' : undefined }} />
                        </View>
                    </Card>
                </View>
            </Modal>
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

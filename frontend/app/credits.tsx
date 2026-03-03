import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, ScrollView, Alert } from 'react-native';
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
            alert('Informe um valor válido.');
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
            alert('Pagamento registrado com sucesso!');
        } catch (e: any) {
            alert(e.response?.data?.detail || 'Erro ao registrar pagamento');
        }
    };

    const undoPayment = async (paymentId: number) => {
        if (confirm('Tem certeza que deseja desfazer/estornar este pagamento?')) {
            try {
                await api.delete(`/credits/payments/${paymentId}`);
                fetchCredits();
                fetchDashboard();
            } catch (e) {
                alert('Erro ao estornar pagamento');
            }
        }
    };

    const deleteCreditCard = async (id: number) => {
        if (confirm('ATENÇÃO: Isso apagará completamente o registro do fiado e retornará o item ao estoque. Continuar?')) {
            try {
                await api.delete(`/credits/${id}`);
                fetchCredits();
                fetchProducts();
                fetchDashboard();
            } catch (e) {
                alert('Erro ao excluir');
            }
        }
    };

    const renderCreditItem = ({ item }: { item: any }) => {
        const prod = products.find(p => p.id === item.product_id);
        const prodName = prod ? prod.name : 'Venda Genérica';
        const remaining = item.total_value - item.paid_amount;

        return (
            <Card style={[styles.card, item.status !== 'PAID' && styles.cardDanger]}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                    {getStatusBadge(item.status)}
                </View>
                <CardContent style={{ padding: 16, paddingTop: 0 }}>
                    <Text style={styles.detailText}>{prodName} (x{item.quantity})</Text>
                    <View style={styles.metricsRow}>
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
                                    <Button variant="ghost" title="x Estornar" textStyle={{ fontSize: 10, color: '#ef4444' }} style={{ paddingVertical: 2, paddingHorizontal: 4 }} onPress={() => undoPayment(p.id)} />
                                </View>
                            ))}
                        </View>
                    )}

                    <View style={styles.actionsRow}>
                        {item.status !== 'PAID' && (
                            <Button style={{ flex: 1, marginRight: 8 }} title="Receber Parte/Tudo" onPress={() => openPayModal(item)} />
                        )}
                        <Button variant="outline" title="Apagar Fiado" onPress={() => deleteCreditCard(item.id)} textStyle={{ color: '#ef4444' }} />
                    </View>
                </CardContent>
            </Card>
        );
    };

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
                contentContainerStyle={{ padding: 24, paddingBottom: 64 }}
            />

            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalCard}>
                        {selectedCredit && (
                            <>
                                <Text style={styles.modalTitle}>Receber de {selectedCredit.customer_name}</Text>
                                <Text style={{ marginBottom: 16 }}>
                                    Restante a pagar: <Text style={{ fontWeight: 'bold', color: '#ef4444' }}>{formatCurrency(selectedCredit.total_value - selectedCredit.paid_amount)}</Text>
                                </Text>

                                <Input label="Valor do Pagamento Agora (R$)" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />

                                <View style={styles.modalActions}>
                                    <Button variant="outline" onPress={() => setModalVisible(false)} title="Cancelar" style={{ flex: 1, marginRight: 12 }} />
                                    <Button onPress={submitPayment} title="Confirmar Pagamento" style={{ flex: 1 }} />
                                </View>
                            </>
                        )}
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
    modalCard: { width: '100%', maxWidth: 400, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b', marginBottom: 8 },
    modalActions: { flexDirection: 'row', marginTop: 16 }
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, Modal } from 'react-native';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Input } from '../components/ui/Input';

export default function SalesHistoryScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { products, fetchProducts, fetchDashboard } = useStore();
    const [sales, setSales] = useState<any[]>([]);
    const [editingSale, setEditingSale] = useState<any | null>(null);
    const [editQuantity, setEditQuantity] = useState('');
    
    // Soft Alert State
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        fetchProducts();
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const { data } = await api.get('/sales/');
            setSales(data);
        } catch (error) { }
    };

    const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    const undoSale = async (id: number) => {
        setConfirmAction({
            message: 'Atenção: Desfazer a venda retornará os itens ao estoque e apagará os registros financeiros.\n\nConfirmar?',
            onConfirm: async () => {
                try {
                    await api.delete(`/sales/${id}`);
                    fetchSales();
                    fetchProducts();
                    fetchDashboard();
                } catch (e) {
                    setAlertMessage('Erro ao desfazer venda');
                }
                setConfirmAction(null);
            }
        });
    };

    const handleEditSave = async () => {
        if (!editingSale || !editQuantity) return;
        
        const newQty = parseInt(editQuantity, 10);
        if (isNaN(newQty) || newQty <= 0) {
            setAlertMessage('A quantidade deve ser maior que zero.');
            return;
        }

        const prod = products.find(p => p.id === editingSale.product_id);
        if (prod) {
            const availableStock = prod.quantity + editingSale.quantity;
            if (newQty > availableStock) {
                setAlertMessage(`Estoque Insuficiente!\n\nVocê está tentando editar a venda para ${newQty} itens, mas só existem ${availableStock} disponíveis no total (estoque atual + devolvidos desta venda).`);
                return;
            }
        }

        try {
            await api.put(`/sales/${editingSale.id}`, {
                quantity: newQty
            });
            setAlertMessage('Venda atualizada com sucesso!');
            setEditingSale(null);
            fetchSales();
            fetchProducts();
            fetchDashboard();
        } catch (e: any) {
            setAlertMessage(e.response?.data?.detail || 'Erro ao editar venda.');
        }
    };

    const renderSaleItem = ({ item }: { item: any }) => {
        const prod = products.find(p => p.id === item.product_id);
        const prodName = prod ? `${prod.name}${prod.variation ? ` (${prod.variation})` : ''}` : `Prod#${item.product_id}`;

        return (
            <View style={[styles.historyCard, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{prodName} (x{item.quantity})</Text>
                    <Text style={styles.historyTotal}>{formatCurrency(item.total_value)}</Text>
                    <Text style={styles.historyDate}>{new Date(item.sale_date).toLocaleString()}</Text>
                    <View style={styles.badgesRow}>
                        {item.payment_methods.map((p: any, idx: number) => (
                            <Badge key={idx} variant={p.method === 'FIADO' ? 'destructive' : 'secondary'} style={{ marginRight: 6, marginTop: 6 }}>
                                {p.method} ({formatCurrency(p.amount)})
                            </Badge>
                        ))}
                    </View>
                </View>
                <View style={{ flexDirection: isMobile ? 'row' : 'column', gap: 8 }}>
                    <Button style={{ backgroundColor: '#3b82f6' }} onPress={() => {
                        setEditingSale(item);
                        setEditQuantity(String(item.quantity));
                    }} title="Editar" />
                    <Button style={{ backgroundColor: '#ef4444' }} onPress={() => undoSale(item.id)} title="Desfazer" textStyle={{ color: '#ffffff' }} />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#09090b" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>Histórico de Vendas</Text>
                    <Text style={styles.subtitle}>Gerencie as últimas vendas registradas.</Text>
                </View>
            </View>

            <View style={{ flex: 1, padding: isMobile ? 12 : 24, maxWidth: 800, width: '100%', alignSelf: 'center' }}>
                <FlatList
                    data={sales}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderSaleItem}
                    contentContainerStyle={{ paddingVertical: 16 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Edit Modal */}
            <Modal visible={!!editingSale} transparent={true} animationType="fade">
                <View style={[styles.modalOverlay, { zIndex: 999 }]}>
                    <Card style={{ ...styles.modalCard as any, maxWidth: 400, alignItems: 'flex-start', padding: isMobile ? 20 : 32 }}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { width: '100%' }]}>Editar Venda</Text>
                        </View>
                        <View style={{ marginBottom: 40, width: '100%' }}>
                            <Text style={{ marginBottom: 16, color: '#71717a' }}>Modificar apenas a quantidade afetará o total e o estoque.</Text>
                            <Input label="Nova Quantidade" keyboardType="numeric" value={editQuantity} onChangeText={setEditQuantity} />
                        </View>
                        <View style={{ flexDirection: isMobile ? 'column' : 'row', justifyContent: 'flex-start', gap: 12, width: '100%' }}>
                            <Button style={{ backgroundColor: '#ef4444', width: isMobile ? '100%' : undefined }} title="Cancelar" onPress={() => setEditingSale(null)} />
                            <Button style={{ backgroundColor: '#16a34a', width: isMobile ? '100%' : undefined }} title="Salvar" onPress={handleEditSave} />
                        </View>
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
    header: { padding: 24, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e4e4e7', flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 16, padding: 8, backgroundColor: '#f4f4f5', borderRadius: 8 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    historyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e4e4e7', flexDirection: 'row', alignItems: 'center' },
    historyTitle: { fontSize: 18, fontWeight: '600', color: '#09090b' },
    historyTotal: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
    historyDate: { fontSize: 12, color: '#a1a1aa', marginTop: 4 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalCard: { width: '100%', maxWidth: 400, padding: 32, backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, width: '100%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b', textAlign: 'center' },
});

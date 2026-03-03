import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList, Modal, TouchableOpacity } from 'react-native';
import { useStore, Product } from '../store/useStore';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { MaterialIcons } from '@expo/vector-icons';

export default function SalesScreen() {
    const { products, fetchProducts, fetchDashboard } = useStore();
    const [sales, setSales] = useState<any[]>([]);

    // Form State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('1');

    // Search Modal State
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Split Payments State
    const [pixAmount, setPixAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [fiadoAmount, setFiadoAmount] = useState('');
    const [fiadoCustomer, setFiadoCustomer] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchSales();
    }, []);

    useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0]);
        }
    }, [products]);

    const fetchSales = async () => {
        try {
            const { data } = await api.get('/sales/');
            setSales(data);
        } catch (error) { }
    };

    const getProductPrice = () => {
        if (!selectedProduct) return 0;
        return Number(selectedProduct.selling_price);
    };

    const calcTotalRequired = () => {
        const qty = parseInt(quantity) || 0;
        return getProductPrice() * qty;
    };

    const calcTotalInputted = () => {
        return (parseFloat(pixAmount) || 0) +
            (parseFloat(cashAmount) || 0) +
            (parseFloat(cardAmount) || 0) +
            (parseFloat(fiadoAmount) || 0);
    };

    const autofillRemaining = (setter: React.Dispatch<React.SetStateAction<string>>) => {
        const required = calcTotalRequired();
        const currentInputted = calcTotalInputted();
        const diff = required - currentInputted;
        if (diff > 0) {
            setter(prev => (parseFloat(prev || '0') + diff).toFixed(2));
        }
    };

    const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    const registerSale = async () => {
        const qty = parseInt(quantity);
        if (!selectedProduct || !qty || qty <= 0) {
            alert('Selecione um produto e uma quantidade válida.');
            return;
        }

        const prod = selectedProduct;
        if (!prod || prod.quantity < qty) {
            alert(`Estoque insuficiente. Disponível: ${prod ? prod.quantity : 0}`);
            return;
        }

        const required = calcTotalRequired();
        const inputted = calcTotalInputted();

        if (Math.abs(required - inputted) > 0.01) {
            alert(`O valor dos pagamentos (${formatCurrency(inputted)}) não bate com o total da compra (${formatCurrency(required)}).`);
            return;
        }

        if (parseFloat(fiadoAmount) > 0 && !fiadoCustomer.trim()) {
            alert('Para vendas no fiado, é obrigatório informar o nome do cliente.');
            return;
        }

        const paymentMethods = [];
        if (parseFloat(pixAmount) > 0) paymentMethods.push({ method: 'PIX', amount: parseFloat(pixAmount) });
        if (parseFloat(cashAmount) > 0) paymentMethods.push({ method: 'CASH', amount: parseFloat(cashAmount) });
        if (parseFloat(cardAmount) > 0) paymentMethods.push({ method: 'CARD', amount: parseFloat(cardAmount) });
        if (parseFloat(fiadoAmount) > 0) paymentMethods.push({ method: 'FIADO', amount: parseFloat(fiadoAmount), customer_name: fiadoCustomer });

        try {
            await api.post('/sales/', {
                product_id: selectedProduct.id,
                quantity: qty,
                payment_methods: paymentMethods
            });
            alert('Venda Múltipla Registrada!');
            setQuantity('1');
            setPixAmount(''); setCashAmount(''); setCardAmount(''); setFiadoAmount(''); setFiadoCustomer('');
            fetchProducts();
            fetchSales();
            fetchDashboard();
        } catch (error: any) {
            alert(error.response?.data?.detail || 'Erro ao registrar venda');
        }
    };

    const undoSale = async (id: number) => {
        if (confirm('Atenção: Desfazer a venda retornará os itens ao estoque e apagará os registros financeiros. Confirmar?')) {
            try {
                await api.delete(`/sales/${id}`);
                fetchSales();
                fetchProducts();
                fetchDashboard();
            } catch (e) {
                alert('Erro ao desfazer venda');
            }
        }
    };

    const renderSaleItem = ({ item }: { item: any }) => {
        const prod = products.find(p => p.id === item.product_id);
        const prodName = prod ? `${prod.name}${prod.variation ? ` (${prod.variation})` : ''}` : `Prod#${item.product_id}`;

        return (
            <View style={styles.historyCard}>
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
                <Button variant="ghost" onPress={() => undoSale(item.id)} title="Desfazer" textStyle={{ color: '#ef4444' }} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Nova Venda</Text>
                    <Text style={styles.subtitle}>Registre vendas com múltiplos pagamentos.</Text>
                </View>
            </View>

            <View style={styles.layoutColumns}>
                {/* Left Column: Form */}
                <ScrollView style={styles.leftColumn} contentContainerStyle={{ padding: 24 }}>
                    <Card style={{ padding: 24 }}>
                        <Text style={styles.sectionTitle}>Produto</Text>

                        <View style={styles.pickerWrapper}>
                            <TouchableOpacity style={styles.productSelectorBtn} onPress={() => setSearchModalVisible(true)}>
                                <Text style={styles.productSelectorText}>
                                    {selectedProduct ? `${selectedProduct.name}${selectedProduct.variation ? ` - ${selectedProduct.variation}` : ''} (${formatCurrency(selectedProduct.selling_price)})` : 'Selecionar Produto...'}
                                </Text>
                                <MaterialIcons name="keyboard-arrow-down" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Input label="Quantidade" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                            </View>
                            <View style={{ flex: 1, backgroundColor: '#f4f4f5', borderRadius: 8, justifyContent: 'center', alignItems: 'center', height: 48, marginTop: 22 }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{formatCurrency(calcTotalRequired())}</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Pagamento (Dividir Valor)</Text>

                        <View style={styles.payRow}>
                            <Input style={{ flex: 1 }} label="PIX" keyboardType="numeric" value={pixAmount} onChangeText={setPixAmount} placeholder="0.00" />
                            <Button variant="ghost" title="Completar" onPress={() => autofillRemaining(setPixAmount)} style={styles.autofillBtn} />
                        </View>

                        <View style={styles.payRow}>
                            <Input style={{ flex: 1 }} label="Dinheiro" keyboardType="numeric" value={cashAmount} onChangeText={setCashAmount} placeholder="0.00" />
                            <Button variant="ghost" title="Completar" onPress={() => autofillRemaining(setCashAmount)} style={styles.autofillBtn} />
                        </View>

                        <View style={styles.payRow}>
                            <Input style={{ flex: 1 }} label="Cartão" keyboardType="numeric" value={cardAmount} onChangeText={setCardAmount} placeholder="0.00" />
                            <Button variant="ghost" title="Completar" onPress={() => autofillRemaining(setCardAmount)} style={styles.autofillBtn} />
                        </View>

                        <View style={styles.payRow}>
                            <Input style={{ flex: 1 }} label="Fiado (A Prazo)" keyboardType="numeric" value={fiadoAmount} onChangeText={setFiadoAmount} placeholder="0.00" />
                            <Button variant="ghost" title="Completar" onPress={() => autofillRemaining(setFiadoAmount)} style={styles.autofillBtn} />
                        </View>

                        {parseFloat(fiadoAmount) > 0 && (
                            <View style={{ marginTop: 8 }}>
                                <Input label="Nome do Cliente (Obrigatório para Fiado)" value={fiadoCustomer} onChangeText={setFiadoCustomer} />
                            </View>
                        )}

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryText}>Total Compra: {formatCurrency(calcTotalRequired())}</Text>
                            <Text style={[styles.summaryText, { color: Math.abs(calcTotalRequired() - calcTotalInputted()) < 0.01 ? '#16a34a' : '#ef4444' }]}>
                                Soma Pagamentos: {formatCurrency(calcTotalInputted())}
                            </Text>
                        </View>

                        <Button title="FINALIZAR VENDA" onPress={registerSale} style={{ marginTop: 16 }} />
                    </Card>
                </ScrollView>

                {/* Right Column: History */}
                <View style={styles.rightColumn}>
                    <Text style={styles.sectionTitle}>Últimas Vendas</Text>
                    <FlatList
                        data={sales}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderSaleItem}
                        contentContainerStyle={{ paddingVertical: 16 }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

            </View>

            {/* Product Search Modal */}
            <Modal visible={searchModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Buscar Produto</Text>
                            <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#71717a" />
                            </TouchableOpacity>
                        </View>

                        <Input
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar por nome ou variação..."
                            autoFocus
                        />

                        <FlatList
                            data={products.filter(p => {
                                const q = searchQuery.toLowerCase();
                                return p.name.toLowerCase().includes(q) || (p.variation && p.variation.toLowerCase().includes(q));
                            })}
                            keyExtractor={p => String(p.id)}
                            style={{ maxHeight: 300, marginTop: 12 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.searchItem}
                                    onPress={() => {
                                        setSelectedProduct(item);
                                        setSearchModalVisible(false);
                                        setSearchQuery('');
                                    }}
                                >
                                    <View>
                                        <Text style={styles.searchItemName}>{item.name}</Text>
                                        <Text style={styles.searchItemDetails}>Estoque: {item.quantity} un</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={styles.searchItemPrice}>{formatCurrency(item.selling_price)}</Text>
                                        {item.variation && <Badge variant="secondary" style={{ marginTop: 4 }}>{item.variation}</Badge>}
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#71717a', padding: 24 }}>Nenhum produto encontrado.</Text>}
                        />
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

    layoutColumns: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
    leftColumn: { flexBasis: 500, flexGrow: 1, minWidth: 300, borderRightWidth: 1, borderColor: '#e4e4e7' },
    rightColumn: { flexBasis: 400, flexGrow: 1, minWidth: 300, padding: 24, backgroundColor: '#fafafa' },

    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#09090b', marginBottom: 16 },
    pickerWrapper: { borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 8, backgroundColor: '#fff', marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    payRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    autofillBtn: { marginTop: 6, marginLeft: 8 },

    summaryBox: { padding: 16, backgroundColor: '#f4f4f5', borderRadius: 8, marginVertical: 16 },
    summaryText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },

    historyCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e4e4e7', flexDirection: 'row', alignItems: 'center' },
    historyTitle: { fontSize: 16, fontWeight: '600', color: '#09090b' },
    historyTotal: { fontSize: 16, fontWeight: 'bold', color: '#16a34a', marginTop: 4 },
    historyDate: { fontSize: 12, color: '#a1a1aa', marginTop: 4 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap' },

    productSelectorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    productSelectorText: { fontSize: 16, color: '#09090b' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalCard: { width: '100%', maxWidth: 500, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b' },
    searchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f4f4f5' },
    searchItemName: { fontSize: 16, fontWeight: '600', color: '#09090b' },
    searchItemDetails: { fontSize: 12, color: '#71717a', marginTop: 4 },
    searchItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#09090b' }
});

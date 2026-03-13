import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, FlatList, Pressable, Animated } from 'react-native';
import { useStore, Product } from '../store/useStore';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';

// Custom Animated Pressable for reusable snappy animations inside Sales
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SnappyButton = ({ onPress, style, children, activeOpacity = 1 }: any) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = () => {
        setIsPressed(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleAnim, { toValue: 0.94, speed: 30, bounciness: 10, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        setIsPressed(false);
        Animated.spring(scaleAnim, { toValue: 1, speed: 30, bounciness: 10, useNativeDriver: true }).start();
    };

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            style={[style, { transform: [{ scale: scaleAnim }], opacity: isPressed ? activeOpacity : 1 }]}
        >
            {children}
        </AnimatedPressable>
    );
};

export default function SalesScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { products, fetchProducts, fetchDashboard } = useStore();

    // Form State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('1');

    // Search Modal State
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Soft Alert State
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    // Payment Mode State
    const [paymentMode, setPaymentMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');
    const [singleMethod, setSingleMethod] = useState<'PIX' | 'CASH' | 'CARD' | 'FIADO'>('PIX');

    // Split Payments State
    const [pixAmount, setPixAmount] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [cardAmount, setCardAmount] = useState('');
    const [fiadoAmount, setFiadoAmount] = useState('');
    const [fiadoCustomer, setFiadoCustomer] = useState('');

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        if (products.length > 0 && !selectedProduct) {
            setSelectedProduct(products[0]);
        }
    }, [products, selectedProduct]);

    const getProductPrice = () => {
        if (!selectedProduct) return 0;
        return Number(selectedProduct.selling_price);
    };

    const calcTotalRequired = () => {
        const qty = parseInt(quantity) || 0;
        return getProductPrice() * qty;
    };

    const calcTotalInputted = () => {
        if (paymentMode === 'SINGLE') return calcTotalRequired();
        return (parseFloat(pixAmount) || 0) +
            (parseFloat(cashAmount) || 0) +
            (parseFloat(cardAmount) || 0) +
            (parseFloat(fiadoAmount) || 0);
    };

    const autofillRemaining = (setter: React.Dispatch<React.SetStateAction<string>>) => {
        const required = calcTotalRequired();
        const currentInputted = (parseFloat(pixAmount) || 0) +
            (parseFloat(cashAmount) || 0) +
            (parseFloat(cardAmount) || 0) +
            (parseFloat(fiadoAmount) || 0);
        const diff = required - currentInputted;
        if (diff > 0) {
            setter(prev => (parseFloat(prev || '0') + diff).toFixed(2));
        }
    };

    const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

    const registerSale = async () => {
        const qty = parseInt(quantity);
        if (!selectedProduct || !qty || qty <= 0) {
            setAlertMessage('Selecione um produto e uma quantidade válida.');
            return;
        }

        const required = calcTotalRequired();
        const inputted = calcTotalInputted();

        if (paymentMode === 'SPLIT' && Math.abs(required - inputted) > 0.01) {
            setAlertMessage(`O valor dos pagamentos (${formatCurrency(inputted)}) não bate com o total da compra (${formatCurrency(required)}).`);
            return;
        }

        if (paymentMode === 'SINGLE' && singleMethod === 'FIADO' && !fiadoCustomer.trim()) {
            setAlertMessage('Para vendas no fiado, é obrigatório informar o nome do cliente.');
            return;
        }

        if (paymentMode === 'SPLIT' && parseFloat(fiadoAmount) > 0 && !fiadoCustomer.trim()) {
            setAlertMessage('Para vendas no fiado, é obrigatório informar o nome do cliente.');
            return;
        }

        const paymentMethods = [];
        if (paymentMode === 'SINGLE') {
            paymentMethods.push({
                method: singleMethod,
                amount: required,
                ...(singleMethod === 'FIADO' ? { customer_name: fiadoCustomer } : {})
            });
        } else {
            if (parseFloat(pixAmount) > 0) paymentMethods.push({ method: 'PIX', amount: parseFloat(pixAmount) });
            if (parseFloat(cashAmount) > 0) paymentMethods.push({ method: 'CASH', amount: parseFloat(cashAmount) });
            if (parseFloat(cardAmount) > 0) paymentMethods.push({ method: 'CARD', amount: parseFloat(cardAmount) });
            if (parseFloat(fiadoAmount) > 0) paymentMethods.push({ method: 'FIADO', amount: parseFloat(fiadoAmount), customer_name: fiadoCustomer });
        }

        try {
            await api.post('/sales/', {
                product_id: selectedProduct.id,
                quantity: qty,
                payment_methods: paymentMethods
            });
            setAlertMessage('Venda Registrada com sucesso!');
            setQuantity('1');
            setSelectedProduct(null);
            setPixAmount(''); setCashAmount(''); setCardAmount(''); setFiadoAmount(''); setFiadoCustomer('');
            fetchProducts();
            fetchDashboard();
        } catch (error: any) {
            setAlertMessage(error.response?.data?.detail || 'Erro ao registrar venda');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: isMobile ? 12 : 24, paddingBottom: 64 }}>
            <View style={[styles.header, isMobile && { flexDirection: 'column', alignItems: 'stretch', gap: 12 }]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Nova Venda</Text>
                    <Text style={styles.subtitle}>Registre uma nova venda no sistema.</Text>
                </View>
                <Button style={{ backgroundColor: '#3b82f6', width: isMobile ? '100%' : undefined }} onPress={() => router.push('/sales-history')} title="Ver Histórico" />
            </View>

            <View style={styles.formContainer}>
                <Card style={{ padding: isMobile ? 16 : 24 }}>
                    <Text style={styles.sectionTitle}>1. Produto e Quantidade</Text>

                    <View style={styles.pickerWrapper}>
                        <SnappyButton style={styles.productSelectorBtn} onPress={() => setSearchModalVisible(true)}>
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productSelectorText} numberOfLines={1}>
                                        {selectedProduct ? `${selectedProduct.name}${selectedProduct.variation ? ` - ${selectedProduct.variation}` : ''}` : 'Selecionar Produto...'}
                                    </Text>
                                </View>
                                {selectedProduct && (
                                    <Text style={{ fontWeight: '600', color: '#09090b', marginRight: 16, fontSize: 16 }}>{formatCurrency(selectedProduct.selling_price)}</Text>
                                )}
                                <MaterialIcons name="keyboard-arrow-down" size={24} color="#71717a" />
                            </View>
                        </SnappyButton>
                    </View>

                    <View style={{ marginBottom: 16 }}>
                        <Input label="Quantidade" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                    </View>
                    <View style={{ backgroundColor: '#f4f4f5', borderRadius: 8, padding: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={{ fontSize: 14, color: '#71717a', marginBottom: 4 }}>Total do Item</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a' }}>{formatCurrency(calcTotalRequired())}</Text>
                    </View>

                    <Text style={[styles.sectionTitle, { marginTop: 32 }]}>2. Forma de Pagamento</Text>

                    <View style={[styles.toggleRow, isMobile && { flexDirection: 'column' }]}>
                        <SnappyButton
                            style={[styles.toggleBtn, paymentMode === 'SINGLE' ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                            onPress={() => setPaymentMode('SINGLE')}
                        >
                            <Text style={[paymentMode === 'SINGLE' ? styles.toggleTextActive : styles.toggleTextInactive, isMobile && { fontSize: 14 }]}>Pagamento Único</Text>
                        </SnappyButton>
                        <SnappyButton
                            style={[styles.toggleBtn, paymentMode === 'SPLIT' ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                            onPress={() => setPaymentMode('SPLIT')}
                        >
                            <Text style={[paymentMode === 'SPLIT' ? styles.toggleTextActive : styles.toggleTextInactive, isMobile && { fontSize: 14 }]}>Dividir Valor</Text>
                        </SnappyButton>
                    </View>

                    {paymentMode === 'SINGLE' ? (
                        <View style={{ marginTop: 16 }}>
                            <View style={[styles.methodsGrid, isMobile && { gap: 8, flexWrap: 'wrap' }]}>
                                {['PIX', 'DINHEIRO', 'CARTÃO', 'FIADO'].map((m) => {
                                    const mapVal = m === 'DINHEIRO' ? 'CASH' : m === 'CARTÃO' ? 'CARD' : m;
                                    return (
                                        <View key={m} style={{ flex: 1, minWidth: isMobile ? '48%' : '23%' }}>
                                            <SnappyButton
                                                style={[styles.methodBox, singleMethod === mapVal ? styles.methodBoxActive : styles.methodBoxInactive]}
                                                onPress={() => setSingleMethod(mapVal as any)}
                                            >
                                                <Text style={[singleMethod === mapVal ? styles.methodBoxTextActive : styles.methodBoxTextInactive, isMobile && { fontSize: 14 }]}>
                                                    {m}
                                                </Text>
                                            </SnappyButton>
                                        </View>
                                    );
                                })}
                            </View>

                            {singleMethod === 'FIADO' && (
                                <View style={{ marginTop: 16 }}>
                                    <Input label="Nome do Cliente (Obrigatório para Fiado)" value={fiadoCustomer} onChangeText={setFiadoCustomer} />
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={{ marginTop: 16 }}>
                            <View style={styles.payRow}>
                                <View style={{ flex: 1, marginRight: isMobile ? 8 : 12 }}>
                                    <Input label="PIX" keyboardType="numeric" value={pixAmount} onChangeText={setPixAmount} placeholder="0.00" style={styles.splitInput} containerStyle={{ marginBottom: 0 }} />
                                </View>
                                <Button style={[styles.completeBtn, { backgroundColor: '#3b82f6' }]} onPress={() => autofillRemaining(setPixAmount)} title="Completar" />
                            </View>
                            <View style={styles.payRow}>
                                <View style={{ flex: 1, marginRight: isMobile ? 8 : 12 }}>
                                    <Input label="Dinheiro" keyboardType="numeric" value={cashAmount} onChangeText={setCashAmount} placeholder="0.00" style={styles.splitInput} containerStyle={{ marginBottom: 0 }} />
                                </View>
                                <Button style={[styles.completeBtn, { backgroundColor: '#3b82f6' }]} onPress={() => autofillRemaining(setCashAmount)} title="Completar" />
                            </View>
                            <View style={styles.payRow}>
                                <View style={{ flex: 1, marginRight: isMobile ? 8 : 12 }}>
                                    <Input label="Cartão" keyboardType="numeric" value={cardAmount} onChangeText={setCardAmount} placeholder="0.00" style={styles.splitInput} containerStyle={{ marginBottom: 0 }} />
                                </View>
                                <Button style={[styles.completeBtn, { backgroundColor: '#3b82f6' }]} onPress={() => autofillRemaining(setCardAmount)} title="Completar" />
                            </View>
                            <View style={styles.payRow}>
                                <View style={{ flex: 1, marginRight: isMobile ? 8 : 12 }}>
                                    <Input label="Fiado" keyboardType="numeric" value={fiadoAmount} onChangeText={setFiadoAmount} placeholder="0.00" style={styles.splitInput} containerStyle={{ marginBottom: 0 }} />
                                </View>
                                <Button style={[styles.completeBtn, { backgroundColor: '#3b82f6' }]} onPress={() => autofillRemaining(setFiadoAmount)} title="Completar" />
                            </View>
                            {parseFloat(fiadoAmount) > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    <Input label="Nome do Cliente" value={fiadoCustomer} onChangeText={setFiadoCustomer} />
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryText}>Total Compra: {formatCurrency(calcTotalRequired())}</Text>
                        {paymentMode === 'SPLIT' && (
                            <Text style={[styles.summaryText, { color: Math.abs(calcTotalRequired() - calcTotalInputted()) < 0.01 ? '#16a34a' : '#ef4444' }]}>
                                Soma Pagamentos: {formatCurrency(calcTotalInputted())}
                            </Text>
                        )}
                    </View>

                    <Button title="FINALIZAR VENDA" onPress={registerSale} style={{ marginTop: 16, backgroundColor: '#16a34a' }} />
                </Card>
            </View>

            {/* Product Search Modal */}
            <ResponsiveModal
                visible={searchModalVisible}
                onRequestClose={() => setSearchModalVisible(false)}
                title="Buscar Produto"
                footer={
                    <Button
                        title="Fechar"
                        variant="outline"
                        onPress={() => setSearchModalVisible(false)}
                        style={{ width: '100%' }}
                    />
                }
            >
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
                    style={{ maxHeight: 320, marginTop: 12 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.searchItem}
                            onPress={() => {
                                setSelectedProduct(item);
                                setSearchModalVisible(false);
                                setSearchQuery('');
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                <Text style={styles.searchItemName}>{item.name}</Text>
                                {item.variation && <Badge variant="secondary" style={{ marginLeft: 8 }}>{item.variation}</Badge>}
                            </View>
                            <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                                <Text style={styles.searchItemPrice}>{formatCurrency(item.selling_price)}</Text>
                                <Text style={styles.searchItemDetails}>Estoque: {item.quantity}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#71717a', padding: 24 }}>Nenhum produto encontrado.</Text>}
                />
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f4f5' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    formContainer: { maxWidth: 600, width: '100%', alignSelf: 'center' },

    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#09090b', marginBottom: 16 },
    pickerWrapper: { borderWidth: 1, borderColor: '#e4e4e7', borderRadius: 8, backgroundColor: '#fff', marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    payRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
    splitInput: { marginBottom: 0, marginTop: 4 },
    completeBtn: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },

    toggleRow: { flexDirection: 'row', gap: 12 },
    toggleBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
    toggleBtnInactive: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
    toggleBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    toggleTextInactive: { color: '#1e3a8a', fontWeight: '600', fontSize: 16 },
    toggleTextActive: { color: '#ffffff', fontWeight: '700', fontSize: 16 },

    methodsGrid: { flexDirection: 'row', flexWrap: 'nowrap', gap: 12 },
    methodBox: { paddingVertical: 18, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, width: '100%', minHeight: 60, justifyContent: 'center' },
    methodBoxInactive: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
    methodBoxActive: { backgroundColor: '#2563eb', borderColor: '#2563eb', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    methodBoxTextInactive: { fontWeight: '600', color: '#1e3a8a', fontSize: 16 },
    methodBoxTextActive: { fontWeight: '700', color: '#ffffff', fontSize: 16 },

    summaryBox: { padding: 16, backgroundColor: '#f4f4f5', borderRadius: 8, marginVertical: 16 },
    summaryText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },

    productSelectorBtn: { backgroundColor: '#fff', borderRadius: 8 },
    productSelectorText: { fontSize: 18, color: '#09090b', fontWeight: '500' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalCard: { width: '100%', maxWidth: 500, padding: 32, maxHeight: '85%', backgroundColor: '#fff' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b' },
    searchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f4f4f5' },
    searchItemName: { fontSize: 16, fontWeight: '600', color: '#09090b' },
    searchItemDetails: { fontSize: 12, color: '#71717a', marginTop: 4 },
    searchItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#09090b' }
});

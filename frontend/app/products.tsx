import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from 'react-native';
import { useStore, Product } from '../store/useStore';
import { api } from '../services/api';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { ResponsiveModal } from '../components/ui/ResponsiveModal';

export default function ProductsScreen() {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;

    const { products, fetchProducts, isLoading } = useStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [variation, setVariation] = useState('');
    const [quantity, setQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    
    // Custom Soft Alert State
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const openModal = (prod?: Product) => {
        if (prod) {
            setEditingId(prod.id);
            setName(prod.name);
            setVariation(prod.variation || '');
            setQuantity(String(prod.quantity));
            setCostPrice(String(prod.cost_price));
            setSellingPrice(String(prod.selling_price));
        } else {
            setEditingId(null);
            setName('');
            setVariation('');
            setQuantity('');
            setCostPrice('');
            setSellingPrice('');
        }
        setModalVisible(true);
    };

    const saveProduct = async () => {
        try {
            if (!name || !quantity || !costPrice || !sellingPrice) {
                setAlertMessage('Preencha todos os campos!');
                return;
            }
            const parseMoney = (value: string) => {
                let val = value.toString().replace(/[^\d.,]/g, '');
                if (val.includes(',') && val.includes('.')) {
                    val = val.replace(/\./g, '').replace(',', '.');
                } else if (val.includes(',')) {
                    val = val.replace(',', '.');
                }
                return parseFloat(val);
            };

            const parsedQty = parseInt(quantity.toString().replace(/\D/g, ''), 10);
            const parsedCost = parseMoney(costPrice);
            const parsedSell = parseMoney(sellingPrice);

            if (isNaN(parsedQty) || isNaN(parsedCost) || isNaN(parsedSell)) {
                setAlertMessage('Quantidade ou Preço possuem formato inválido.');
                return;
            }

            const payload = {
                name,
                variation: variation || null,
                quantity: parsedQty,
                cost_price: parsedCost,
                selling_price: parsedSell,
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products/', payload);
            }

            setModalVisible(false);
            fetchProducts();
        } catch (error: any) {
            console.error(error.response?.data || error);
            const detail = error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail;
            if (!error.response) {
                setAlertMessage('Não foi possível conectar à API. Verifique se o backend está rodando na porta 8000.');
                return;
            }
            setAlertMessage(detail || 'Erro ao salvar produto');
        }
    };

    const deleteProduct = async (id: number) => {
        setConfirmAction({
            message: 'Tem certeza que deseja apagar este produto?\n\nAo invés de apagar, pode ser útil apenas zerar o estoque dele.',
            onConfirm: async () => {
                try {
                    await api.delete(`/products/${id}`);
                    fetchProducts();
                } catch (error: any) {
                    const detail = error?.response?.data?.detail;
                    setAlertMessage(detail || 'Erro ao apagar item.');
                }
                setConfirmAction(null);
            }
        });
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isLowStock = item.quantity <= 2;
        const profitMargin = ((item.selling_price - item.cost_price) / item.cost_price * 100).toFixed(0);

        return (
            <Card style={styles.productCard}>
                <CardContent style={isMobile ? { ...styles.cardRow, flexDirection: 'column', alignItems: 'stretch' } as any : styles.cardRow}>
                    <View style={{ flex: 1, paddingTop: 12, paddingBottom: isMobile ? 12 : 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                {item.variation ? <Badge variant="secondary" style={{ marginLeft: 6 }}>{item.variation}</Badge> : null}
                            </View>
                            {isLowStock && <Badge variant="destructive" style={{ marginLeft: 8 }}>Estoque Baixo</Badge>}
                        </View>
                        <Text style={styles.productDetails}>
                            Estoque: <Text style={{ fontWeight: 'bold' }}>{item.quantity}</Text> un
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
                            <Text style={styles.priceText}>Venda: R$ {item.selling_price.toFixed(2).replace('.', ',')}</Text>
                            <Text style={styles.costText}>Custo: R$ {item.cost_price.toFixed(2).replace('.', ',')}</Text>
                            <Badge variant="secondary">Margem: {profitMargin}%</Badge>
                        </View>
                    </View>

                    <View style={isMobile ? { flexDirection: 'row', gap: 8, paddingTop: 16, borderTopWidth: 1, borderColor: '#f4f4f5' } as any : { flexDirection: 'row', gap: 8, width: '100%', justifyContent: 'flex-start', alignItems: 'center', marginTop: 16 }}>
                        <Button style={{ width: 100, backgroundColor: '#3b82f6', paddingVertical: 8 }} onPress={() => openModal(item)} title="Editar" textStyle={{ fontSize: 13 }} />
                        <Button style={{ width: 100, backgroundColor: '#dc2626', paddingVertical: 8 }} onPress={() => deleteProduct(item.id)} title="Excluir" textStyle={{ fontSize: 13 }} />
                    </View>
                </CardContent>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={isMobile ? { ...styles.header, flexDirection: 'column', alignItems: 'flex-start' } as any : styles.header}>
                <View style={{ marginBottom: isMobile ? 16 : 0 }}>
                    <Text style={styles.title}>Estoque ({products.length})</Text>
                    <Text style={styles.subtitle}>Gerencie os produtos da sua loja.</Text>
                </View>
                <Button onPress={() => openModal()} title="+ Novo Produto" style={[isMobile ? { width: '100%' } : {}, { backgroundColor: '#3b82f6' }]} />
            </View>

            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar por nome ou variação..."
                />
            </View>

            <FlatList
                data={products.filter(p => {
                    const q = searchQuery.toLowerCase();
                    return p.name.toLowerCase().includes(q) || (p.variation && p.variation.toLowerCase().includes(q));
                })}
                keyExtractor={item => String(item.id)}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                refreshing={isLoading}
                onRefresh={fetchProducts}
                ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#71717a', paddingTop: 24 }}>Nenhum produto encontrado na busca.</Text>}
            />

            <ResponsiveModal
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
                title={editingId ? 'Editar Produto' : 'Novo Produto'}
                footer={
                    <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 12, width: '100%' }}>
                        <Button
                            variant="outline"
                            onPress={() => {
                                setConfirmAction({
                                    message: "Tem certeza que deseja cancelar? Você perderá todas as alterações realizadas.",
                                    onConfirm: () => {
                                        setModalVisible(false);
                                        setConfirmAction(null);
                                    }
                                });
                            }}
                            title="Cancelar"
                            style={{ flex: 1, width: isMobile ? '100%' : undefined }}
                        />
                        <Button onPress={saveProduct} title="Salvar" style={{ flex: 1, backgroundColor: '#16a34a', width: isMobile ? '100%' : undefined }} />
                    </View>
                }
            >
                <Input label="Nome do Produto" value={name} onChangeText={setName} />
                <Input label="Variação / Tamanho (Opcional)" value={variation} onChangeText={setVariation} placeholder="Ex: G, Jeans 40, Azul..." />
                <Input label="Quantidade em Estoque" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                <Input label="Preço de Custo (R$)" keyboardType="numeric" value={costPrice} onChangeText={setCostPrice} />
                <Input label="Preço de Venda (R$)" keyboardType="numeric" value={sellingPrice} onChangeText={setSellingPrice} />
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#09090b', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#71717a', marginTop: 4 },

    listContainer: { paddingHorizontal: 24, paddingBottom: 64 },
    productCard: { marginBottom: 16 },
    cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    productName: { fontSize: 18, fontWeight: '600', color: '#09090b' },
    productDetails: { fontSize: 14, color: '#71717a' },
    priceText: { fontSize: 14, fontWeight: '600', color: '#09090b' },
    costText: { fontSize: 14, color: '#a1a1aa' },
    actionColumn: { flexDirection: 'column', gap: 8, paddingLeft: 16, borderLeftWidth: 1, borderColor: '#f4f4f5' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
    modalCard: { width: '100%', maxWidth: 500, maxHeight: '90%', padding: 32 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b', marginBottom: 24, textAlign: 'center' },
    modalActions: { flexDirection: 'row', marginTop: 16 }
});

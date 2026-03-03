import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, ScrollView, Alert } from 'react-native';
import { useStore, Product } from '../store/useStore';
import { api } from '../services/api';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export default function ProductsScreen() {
    const { products, fetchProducts, isLoading } = useStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [name, setName] = useState('');
    const [variation, setVariation] = useState('');
    const [quantity, setQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [sellingPrice, setSellingPrice] = useState('');

    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

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
                alert('Preencha todos os campos!');
                return;
            }
            const payload = {
                name,
                variation: variation || null,
                quantity: parseInt(quantity),
                cost_price: parseFloat(costPrice),
                selling_price: parseFloat(sellingPrice),
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post('/products/', payload);
            }

            setModalVisible(false);
            fetchProducts();
        } catch (error) {
            alert('Erro ao salvar produto');
        }
    };

    const deleteProduct = async (id: number) => {
        if (confirm('Tem certeza que deseja apagar este produto? Ao invés de apagar, pode ser util apenas zerar o estoque dele.')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch (error) {
                alert('Erro ao excluir');
            }
        }
    };

    const renderItem = ({ item }: { item: Product }) => {
        const isLowStock = item.quantity <= 2;
        const profitMargin = ((item.selling_price - item.cost_price) / item.cost_price * 100).toFixed(0);

        return (
            <Card style={styles.productCard}>
                <CardContent style={styles.cardRow}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.productName}>{item.name}</Text>
                            {item.variation ? <Badge variant="secondary" style={{ marginLeft: 6 }}>{item.variation}</Badge> : null}
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

                    <View style={styles.actionColumn}>
                        <Button variant="ghost" onPress={() => openModal(item)} title="Editar" />
                        <Button variant="destructive" onPress={() => deleteProduct(item.id)} title="Excluir" />
                    </View>
                </CardContent>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Estoque ({products.length})</Text>
                    <Text style={styles.subtitle}>Gerencie os produtos da sua loja.</Text>
                </View>
                <Button onPress={() => openModal()} title="+ Novo Produto" />
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

            <Modal visible={modalVisible} transparent={true} animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{editingId ? 'Editar Produto' : 'Novo Produto'}</Text>

                        <Input label="Nome do Produto" value={name} onChangeText={setName} />
                        <Input label="Variação / Tamanho (Opcional)" value={variation} onChangeText={setVariation} placeholder="Ex: G, Jeans 40, Azul..." />
                        <Input label="Quantidade em Estoque" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Input style={{ flex: 1 }} label="Preço de Custo (R$)" keyboardType="numeric" value={costPrice} onChangeText={setCostPrice} />
                            <Input style={{ flex: 1 }} label="Preço de Venda (R$)" keyboardType="numeric" value={sellingPrice} onChangeText={setSellingPrice} />
                        </View>

                        <View style={styles.modalActions}>
                            <Button variant="outline" onPress={() => setModalVisible(false)} title="Cancelar" style={{ flex: 1 }} />
                            <View style={{ width: 12 }} />
                            <Button onPress={saveProduct} title="Salvar" style={{ flex: 1 }} />
                        </View>
                    </Card>
                </View>
            </Modal>
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
    modalCard: { width: '100%', maxWidth: 500, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#09090b', marginBottom: 24 },
    modalActions: { flexDirection: 'row', marginTop: 16 }
});

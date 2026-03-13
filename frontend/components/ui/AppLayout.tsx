import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text, SafeAreaView, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Slot, useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
    { name: 'index', label: 'Dashboard', icon: 'dashboard' },
    { name: 'products', label: 'Estoque', icon: 'inventory' },
    { name: 'sales', label: 'Vender', icon: 'point-of-sale' },
    { name: 'credits', label: 'Fiado', icon: 'book' },
    { name: 'reports', label: 'Relatórios', icon: 'bar-chart' },
];

export function AppLayout() {
    const { width } = useWindowDimensions();
    const isLargeScreen = width >= 768; // Tablet/Desktop breakpoint
    const router = useRouter();
    const pathname = usePathname();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleNav = (route: string) => {
        setIsMenuOpen(false);
        router.push(route === 'index' ? '/' : `/${route}` as any);
    };

    const isActive = (route: string) => {
        if (route === 'index') return pathname === '/';
        return pathname.startsWith(`/${route}`);
    };

    const renderNavItem = (item: any) => {
        const active = isActive(item.name);
        return (
            <TouchableOpacity
                key={item.name}
                style={[
                    styles.navItem,
                    styles.navItemLarge,
                    active && styles.navItemActive
                ]}
                onPress={() => handleNav(item.name)}
            >
                <MaterialIcons
                    name={item.icon}
                    size={24}
                    color={active ? '#18181b' : '#71717a'}
                />
                <Text style={[
                    styles.navLabel,
                    active ? styles.navLabelActive : styles.navLabelInactive
                ]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    if (isLargeScreen) {
        // Desktop / POS Layout: Sidebar left
        return (
            <View style={styles.containerLarge}>
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <MaterialIcons name="storefront" size={32} color="#18181b" />
                        <Text style={styles.sidebarTitle}>Loula Control</Text>
                    </View>
                    <View style={styles.sidebarNav}>
                        {NAV_ITEMS.map(renderNavItem)}
                    </View>
                </View>
                <View style={styles.mainContent}>
                    <SafeAreaView style={{ flex: 1 }}>
                        <Slot />
                    </SafeAreaView>
                </View>
            </View>
        );
    }

    // Mobile Layout: Top Header with Hamburger Menu right
    return (
        <View style={styles.containerSmall}>
            <View style={styles.mobileHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialIcons name="storefront" size={24} color="#18181b" />
                    <Text style={styles.mobileHeaderTitle}>Loula Control</Text>
                </View>
                <TouchableOpacity onPress={() => setIsMenuOpen(true)} style={{ padding: 8 }}>
                    <MaterialIcons name="menu" size={28} color="#18181b" />
                </TouchableOpacity>
            </View>

            <View style={styles.mainContent}>
                <SafeAreaView style={{ flex: 1 }}>
                    <Slot />
                </SafeAreaView>
            </View>

            <Modal visible={isMenuOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.mobileMenu}>
                        <View style={styles.mobileMenuHeader}>
                            <Text style={styles.mobileMenuTitle}>Menu</Text>
                            <TouchableOpacity onPress={() => setIsMenuOpen(false)} style={{ padding: 8 }}>
                                <MaterialIcons name="close" size={28} color="#18181b" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sidebarNav}>
                            {NAV_ITEMS.map(renderNavItem)}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    containerLarge: { flex: 1, flexDirection: 'row', backgroundColor: '#f4f4f5' },
    containerSmall: { flex: 1, backgroundColor: '#f4f4f5' },

    sidebar: { width: 250, backgroundColor: '#ffffff', borderRightWidth: 1, borderColor: '#e4e4e7', paddingVertical: 24, paddingHorizontal: 16 },
    sidebarHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, paddingHorizontal: 8 },
    sidebarTitle: { fontSize: 20, fontWeight: 'bold', color: '#18181b', marginLeft: 12 },
    sidebarNav: { flex: 1, gap: 8 },

    mobileHeader: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderColor: '#e4e4e7', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
    mobileHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#18181b', marginLeft: 8 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' },
    mobileMenu: { width: 250, height: '100%', backgroundColor: '#ffffff', padding: 20, paddingTop: 20, elevation: 5, boxShadow: '0px 0px 10px rgba(0,0,0,0.1)' },
    mobileMenuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    mobileMenuTitle: { fontSize: 20, fontWeight: 'bold', color: '#18181b' },

    mainContent: { flex: 1, backgroundColor: '#f4f4f5' },

    navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
    navItemLarge: { padding: 12 },
    navItemActive: { backgroundColor: '#f4f4f5' },

    navLabel: { marginLeft: 12, fontSize: 16, fontWeight: '500' },
    navLabelActive: { color: '#18181b' },
    navLabelInactive: { color: '#71717a' }
});

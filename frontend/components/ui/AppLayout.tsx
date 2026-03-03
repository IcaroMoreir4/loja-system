import React from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text, Animated, SafeAreaView } from 'react-native';
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

    const handleNav = (route: string) => {
        // pathname can be /products, nav item name is 'products'. 'index' maps to '/'
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
                    isLargeScreen ? styles.navItemLarge : styles.navItemSmall,
                    active && styles.navItemActive
                ]}
                onPress={() => handleNav(item.name)}
            >
                <MaterialIcons
                    name={item.icon}
                    size={isLargeScreen ? 24 : 28}
                    color={active ? '#18181b' : '#71717a'}
                />
                {(isLargeScreen || active) && (
                    <Text style={[
                        styles.navLabel,
                        active ? styles.navLabelActive : styles.navLabelInactive,
                        !isLargeScreen && { fontSize: 10, marginTop: 4 }
                    ]}>
                        {item.label}
                    </Text>
                )}
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

    // Mobile Layout: Bottom Action Bar
    return (
        <View style={styles.containerSmall}>
            <View style={styles.mainContent}>
                <SafeAreaView style={{ flex: 1 }}>
                    <Slot />
                </SafeAreaView>
            </View>
            <View style={styles.bottomBar}>
                {NAV_ITEMS.map(renderNavItem)}
            </View>
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

    bottomBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e4e4e7', paddingBottom: 24, paddingTop: 12, justifyContent: 'space-around', alignItems: 'center' },

    mainContent: { flex: 1, backgroundColor: '#f4f4f5' },

    navItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 8 },
    navItemLarge: { padding: 12 },
    navItemSmall: { flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 64 },
    navItemActive: { backgroundColor: '#f4f4f5' },

    navLabel: { marginLeft: 12, fontSize: 14, fontWeight: '500' },
    navLabelActive: { color: '#18181b' },
    navLabelInactive: { color: '#71717a' }
});

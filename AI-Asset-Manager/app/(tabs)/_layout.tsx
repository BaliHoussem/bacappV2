import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform, View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const TAB_BAR_H = 62;
const TAB_BAR_MARGIN = 16;
const TAB_BAR_RADIUS = 22;

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="sections">
        <Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2.fill" }} />
        <Label>الأقسام</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tasks">
        <Icon sf={{ default: "checkmark.circle", selected: "checkmark.circle.fill" }} />
        <Label>المهام</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ranking">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>التصنيف</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>الرئيسية</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

const TAB_CONFIG = [
  { name: "sections", icon: "grid-outline", iconActive: "grid", label: "الأقسام", color: "#7C5CFF" },
  { name: "tasks", icon: "checkmark-circle-outline", iconActive: "checkmark-circle", label: "المهام", color: "#4FC3F7" },
  { name: "ranking", icon: "podium-outline", iconActive: "podium", label: "التصنيف", color: "#FFB74D" },
  { name: "index", icon: "home-outline", iconActive: "home", label: "الرئيسية", color: "#00D4AA" },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Platform.OS === "web" ? TAB_BAR_MARGIN : Math.max(insets.bottom, 8) + 8;

  return (
    <View style={[ts.bar, { bottom: bottomOffset }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = TAB_CONFIG.find(t => t.name === route.name) || TAB_CONFIG[0];
        const focused = state.index === index;
        const iconName = (focused ? tab.iconActive : tab.icon) as any;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={ts.tabButton}
          >
            {focused ? (
              <View style={[ts.activePill, { backgroundColor: `${tab.color}18`, borderColor: `${tab.color}40` }]}>
                <Ionicons name={iconName} size={19} color={tab.color} />
                <Text style={[ts.activeLabel, { color: tab.color }]}>{tab.label}</Text>
              </View>
            ) : (
              <Ionicons name={iconName} size={22} color={Colors.textMuted} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function ClassicTabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map(tab => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}

const ts = StyleSheet.create({
  bar: {
    position: "absolute",
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    height: TAB_BAR_H,
    backgroundColor: "#0C1018",
    borderRadius: TAB_BAR_RADIUS,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)" } as any
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 12,
        }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: TAB_BAR_H,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  activeLabel: {
    fontSize: 12,
    fontFamily: "Cairo_700Bold",
  },
});

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

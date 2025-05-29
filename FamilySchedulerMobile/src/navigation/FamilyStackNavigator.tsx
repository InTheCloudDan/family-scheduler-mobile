import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FamilyScreen from '../screens/Family/FamilyScreen';
import FamilyDetailScreen from '../screens/Family/FamilyDetailScreen';
import FamilyFormScreen from '../screens/Family/FamilyFormScreen';
import MemberManagementScreen from '../screens/Family/MemberManagementScreen';
import ChildManagementScreen from '../screens/Family/ChildManagementScreen';
import InviteFormScreen from '../screens/Family/InviteFormScreen';
import AddChildScreen from '../screens/Family/AddChildScreen';
import EditChildScreen from '../screens/Family/EditChildScreen';
import { Child } from '../store/slices/familySlice'; // Import Child type

export type FamilyStackParamList = {
  FamilyList: undefined;
  FamilyDetail: { familyId: number };
  FamilyForm: { familyId?: number };
  MemberManagement: { familyId: number };
  ChildManagement: { familyId: number };
  InviteForm: { familyId: number };
  AddChild: { familyId: number };
  EditChild: { familyId: number; child: Child }; // Add EditChild params
};

const Stack = createStackNavigator<FamilyStackParamList>();

const FamilyStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyList" component={FamilyScreen} />
      <Stack.Screen name="FamilyDetail" component={FamilyDetailScreen} />
      <Stack.Screen name="FamilyForm" component={FamilyFormScreen} />
      <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
      <Stack.Screen name="ChildManagement" component={ChildManagementScreen} />
      <Stack.Screen name="InviteForm" component={InviteFormScreen} />
      <Stack.Screen name="AddChild" component={AddChildScreen} />
      <Stack.Screen name="EditChild" component={EditChildScreen} />
    </Stack.Navigator>
  );
};

export default FamilyStackNavigator;

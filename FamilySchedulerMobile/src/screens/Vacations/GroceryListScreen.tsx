import React, { useEffect, useState, useCallback, useMemo } from 'react'; // Added useMemo
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native'; // Added Alert
import { Text, Appbar, ActivityIndicator, List, Checkbox, FAB, Portal, Dialog, TextInput, Button, Modal, IconButton, HelperText, Title, Caption, Chip, Divider } from 'react-native-paper'; // Added Modal, IconButton, HelperText, Title, Caption, Chip, Divider
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // Keep AppDispatch
// import { RootState } from '../../store'; // Removed unused RootState import
import {
  fetchGroceryLists,
  createGroceryList, // Import create list action
  // toggleGroceryItem, // Replaced by updateGroceryItem
  createGroceryItem, // Import create item action
  updateGroceryItem, // Import update item action
  deleteGroceryItem, // Import delete item action
  selectGroceryListsForVacation,
  selectGroceryListById,
  selectGroceryListsLoading,
  selectItemUpdateLoading, // Import item update loading selector
  selectVacationsError, // General fetch error
  selectItemUpdateError, // Import item update error selector
  clearItemUpdateError, // Import clear item error action
  GroceryList,
  GroceryItem
} from '../../store/slices/vacationsSlice';
import { VacationsStackParamList } from '../../navigation/VacationsStackNavigator';

type GroceryListScreenRouteProp = RouteProp<VacationsStackParamList, 'GroceryList'>;
type GroceryListScreenNavigationProp = StackNavigationProp<VacationsStackParamList, 'GroceryList'>;

const GroceryListScreen = () => {
  const route = useRoute<GroceryListScreenRouteProp>();
  const navigation = useNavigation<GroceryListScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { vacationId, listId } = route.params; // listId is optional

  // Selectors
  const allGroceryLists = useSelector(selectGroceryListsForVacation);
  const selectedList = useSelector(selectGroceryListById(listId ?? -1));
  // const groceryItems = selectedList?.items || []; // No longer needed directly, use selectedList.items
  const isLoading = useSelector(selectGroceryListsLoading); // List loading
  const isItemUpdating = useSelector(selectItemUpdateLoading); // Item CUD loading
  const fetchError = useSelector(selectVacationsError); // General fetch error
  const itemUpdateError = useSelector(selectItemUpdateError); // Item CUD error
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for Create List Dialog
  const [listDialogVisible, setListDialogVisible] = useState(false); // Renamed
  const [newListName, setNewListName] = useState('');

  // State for Add/Edit Item Modal
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1'); // Default quantity as string
  const [itemUnit, setItemUnit] = useState(''); // Added state for unit
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  // TODO: Add state for category, assigned_to if implementing those fields

  // Fetch data logic
  const loadLists = useCallback(() => {
    // Fetch only if lists aren't loaded or maybe always if viewing a specific list?
    if (listId && !selectedList && !isLoading) {
        dispatch(fetchGroceryLists(vacationId));
    } else if (!listId && allGroceryLists.length === 0 && !isLoading) {
       dispatch(fetchGroceryLists(vacationId));
    }
  }, [dispatch, vacationId, listId, selectedList, allGroceryLists, isLoading]);

  useEffect(() => {
    loadLists();
    // Clear item update error on unmount or when listId changes
    return () => {
        dispatch(clearItemUpdateError());
    };
  }, [loadLists, dispatch, listId]); // Combined load and cleanup

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchGroceryLists(vacationId)).unwrap();
    } catch (e) {
      console.error("Failed to refresh grocery data:", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, vacationId]);

  // Use updateGroceryItem for toggling completion
  const handleToggleItem = (item: GroceryItem) => {
    // Pass the correct payload including the 'is_completed' field
    dispatch(updateGroceryItem({ id: item.id, is_completed: !item.is_completed }));
    // Note: Error handling is done via the selector below
  };

  const handleSelectList = (selectedListId: number) => {
    navigation.push('GroceryList', { vacationId, listId: selectedListId });
  };

  // --- List Dialog Handlers ---
  const showListDialog = () => setListDialogVisible(true); // Renamed
  const hideListDialog = () => { // Renamed
      setListDialogVisible(false);
      setNewListName('');
  };

  const submitNewList = async () => {
    if (newListName.trim()) {
      try {
        const resultAction = await dispatch(createGroceryList({ vacationId, name: newListName.trim() }));
        if (createGroceryList.fulfilled.match(resultAction)) {
          // Re-fetch the lists after successful creation
          await dispatch(fetchGroceryLists(vacationId)).unwrap(); // Re-fetch and wait
          hideListDialog(); // Renamed
        } else {
           console.error("Failed to create grocery list:", resultAction.payload);
           Alert.alert("Error", `Failed to create list: ${resultAction.payload}`);
           // hideListDialog(); // Keep open on error?
        }
      } catch (err: any) { // Catch errors from unwrap() if used, or network errors
         Alert.alert("Error", `Failed to create list: ${err.message || 'Unknown error'}`);
         // hideListDialog();
      }
    }
  };

  // --- Item Modal Handlers (Similar to PackingListScreen) ---
  const showItemModal = (itemToEdit: GroceryItem | null = null) => {
    setEditingItem(itemToEdit);
    setItemName(itemToEdit?.name || '');
    setItemDescription(itemToEdit?.description || '');
    setItemQuantity(String(itemToEdit?.quantity || 1));
    setItemUnit(itemToEdit?.unit || ''); // Added unit
    setItemFormError(null);
    dispatch(clearItemUpdateError());
    setItemModalVisible(true);
  };

  const hideItemModal = () => {
    setItemModalVisible(false);
    setEditingItem(null);
    setItemName('');
    setItemDescription('');
    setItemQuantity('1');
    setItemUnit(''); // Clear unit
    setItemFormError(null);
  };

  const submitItemForm = async () => {
    if (!itemName.trim()) {
      setItemFormError('Item name cannot be empty.');
      return;
    }
    if (!listId) {
        setItemFormError('Cannot determine the grocery list.');
        return;
    }
    const quantityNum = parseInt(itemQuantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
        setItemFormError('Quantity must be a positive number.');
        return;
    }
    setItemFormError(null);

    const payload = {
      name: itemName.trim(),
      description: itemDescription.trim() || undefined,
      quantity: quantityNum,
      unit: itemUnit.trim() || undefined, // Add unit
      // TODO: Add category, assigned_to
    };

    try {
        if (editingItem) {
          await dispatch(updateGroceryItem({ id: editingItem.id, ...payload })).unwrap();
        } else {
          await dispatch(createGroceryItem({ grocery_list: listId, ...payload })).unwrap();
        }
        hideItemModal();
    } catch (err: any) {
        console.error("Failed to save grocery item:", err);
        // Error shown in modal
    }
  };

   const handleDeleteItem = (item: GroceryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
                await dispatch(deleteGroceryItem(item.id)).unwrap();
            } catch (err: any) {
                 Alert.alert('Error', `Failed to delete item: ${err.message || itemUpdateError || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  // --- Item Grouping (Optional for Grocery, using FlatList for now) ---
   const sortedItems = useMemo(() => {
     return [...(selectedList?.items || [])].sort((a, b) => a.name.localeCompare(b.name));
   }, [selectedList]);


  // Determine title based on whether a specific list is selected
  const screenTitle = selectedList?.name || 'Grocery Lists';

  // --- Render Functions ---

  const renderListItem = ({ item }: { item: GroceryList }) => (
    <List.Item
      title={item.name}
      description={item.description || (item.is_group ? 'Group List' : `Personal List (${item.owner_details?.username || '...'})`)}
      left={props => <List.Icon {...props} icon={item.is_group ? "account-group" : "account"} />}
      onPress={() => handleSelectList(item.id)}
      // TODO: Add list edit/delete options
    />
  );

  const renderItemItem = ({ item }: { item: GroceryItem }) => (
     <View>
        <View style={styles.itemContainer}>
            <Checkbox.Item
                style={styles.checkboxItem}
                label={`${item.name || 'Unnamed Item'}`} // Quantity/Unit moved below
                status={item.is_completed ? 'checked' : 'unchecked'}
                onPress={() => handleToggleItem(item)} // Pass full item
                labelStyle={item.is_completed ? styles.itemCompleted : null}
                disabled={isItemUpdating}
            />
            <View style={styles.itemActions}>
                <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => showItemModal(item)}
                    disabled={isItemUpdating}
                />
                <IconButton
                    icon="delete"
                    size={20}
                    iconColor="red"
                    onPress={() => handleDeleteItem(item)}
                    disabled={isItemUpdating}
                />
            </View>
        </View>
        {/* Details */}
        {(item.description || item.assigned_to_details || item.quantity || item.unit) && (
            <View style={styles.itemDetails}>
                {item.quantity && <Caption style={styles.itemDetailText}>Qty: {item.quantity}{item.unit ? ` ${item.unit}` : ''}</Caption>}
                {item.description ? <Caption style={styles.itemDetailText}>{item.description}</Caption> : null}
                {item.assigned_to_details && (
                    <Chip icon="account" style={styles.chip} textStyle={styles.chipText} mode="outlined">
                        {item.assigned_to_details.username}
                    </Chip>
                )}
            </View>
        )}
    </View>
  );

   const renderContent = () => {
    if (isLoading && !isRefreshing) { // Check list loading
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }
    if (fetchError && !isLoading) { // Check fetch error
      return <Text style={styles.centered}>Error loading data: {fetchError}</Text>;
    }
    // Item update errors handled in modal/alert

    if (listId) {
      // Display Items
      if (!selectedList && !isLoading) {
         return <Text style={styles.centered}>List not found.</Text>;
      }
      // Show empty message only if not loading and items are truly empty
      if (selectedList && sortedItems.length === 0 && !isLoading) {
        return <Text style={styles.centered}>No items added yet. Press '+' to add.</Text>;
      }
      return (
        <FlatList // Use FlatList for items
          data={sortedItems} // Use sorted items
          renderItem={renderItemItem}
          keyExtractor={(item) => item.id.toString()}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />} // Use imported Divider
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
           ListEmptyComponent={ // Show only if sections are empty *after* potential loading
             !isLoading ? <Text style={styles.centered}>No items added yet. Press '+' to add.</Text> : null
          }
        />
      );
    } else {
      // Display Lists
      if (allGroceryLists.length === 0 && !isLoading) {
        return <Text style={styles.centered}>No grocery lists created yet. Press '+' to add.</Text>;
      }
      return (
        <FlatList
          data={allGroceryLists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
           ListEmptyComponent={ // Show only if list is empty *after* potential loading
             !isLoading ? <Text style={styles.centered}>No grocery lists created yet. Press '+' to add.</Text> : null
          }
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={screenTitle} subtitle={`Vacation ${vacationId}`} />
        {/* TODO: Add Edit/Delete actions for the LIST itself if needed */}
      </Appbar.Header>
      {renderContent()}
      {/* Show FAB based on context */}
       {listId ? (
         // FAB for adding ITEMS
         <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => showItemModal()}
            disabled={isItemUpdating || isLoading}
         />
      ) : (
         // FAB for adding LISTS
         <FAB
            style={styles.fab}
            icon="cart-plus" // Use grocery specific icon
            onPress={showListDialog} // Use renamed handler
            disabled={isLoading}
         />
      )}

       {/* Create List Dialog */}
       <Portal>
            <Dialog visible={listDialogVisible} onDismiss={hideListDialog}>
            <Dialog.Title>New Grocery List</Dialog.Title>
            <Dialog.Content>
                <TextInput
                    label="List Name"
                    value={newListName}
                    onChangeText={setNewListName}
                    mode="outlined"
                    autoFocus
                />
                 {/* TODO: Add options for description, is_group? */}
            </Dialog.Content>
            <Dialog.Actions>
                <Button onPress={hideListDialog}>Cancel</Button>
                <Button onPress={submitNewList} disabled={!newListName.trim() || isLoading}>Create</Button>
            </Dialog.Actions>
            </Dialog>
       </Portal>

        {/* Add/Edit Item Modal */}
        <Portal>
            <Modal visible={itemModalVisible} onDismiss={hideItemModal} contentContainerStyle={styles.modalContainer}>
                <Title>{editingItem ? 'Edit Item' : 'Add New Item'}</Title>
                <TextInput
                    label="Item Name"
                    value={itemName}
                    onChangeText={setItemName}
                    mode="outlined"
                    style={styles.modalInput}
                    error={!!itemFormError && itemName.trim() === ''}
                    autoFocus={!editingItem}
                />
                 <TextInput
                    label="Description (Optional)"
                    value={itemDescription}
                    onChangeText={setItemDescription}
                    mode="outlined"
                    style={styles.modalInput}
                    multiline
                />
                 <View style={styles.quantityRow}>
                    <TextInput
                        label="Quantity"
                        value={itemQuantity}
                        onChangeText={setItemQuantity}
                        mode="outlined"
                        style={[styles.modalInput, styles.quantityInput]}
                        keyboardType="numeric"
                        error={!!itemFormError && (isNaN(parseInt(itemQuantity, 10)) || parseInt(itemQuantity, 10) < 1)}
                    />
                    <TextInput
                        label="Unit (Optional)"
                        value={itemUnit}
                        onChangeText={setItemUnit}
                        mode="outlined"
                        style={[styles.modalInput, styles.unitInput]}
                    />
                 </View>
                {/* TODO: Add Category Picker */}
                {/* TODO: Add Assignee Picker */}

                {itemFormError && <HelperText type="error" visible={!!itemFormError}>{itemFormError}</HelperText>}
                {itemUpdateError && <HelperText type="error" visible={!!itemUpdateError}>Error: {itemUpdateError}</HelperText>}

                <View style={styles.modalActions}>
                    <Button onPress={hideItemModal} disabled={isItemUpdating}>Cancel</Button>
                    <Button
                        onPress={submitItemForm}
                        disabled={isItemUpdating || !itemName.trim() || isNaN(parseInt(itemQuantity, 10)) || parseInt(itemQuantity, 10) < 1}
                        loading={isItemUpdating}
                    >
                        {editingItem ? 'Save Changes' : 'Add Item'}
                    </Button>
                </View>
            </Modal>
        </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    textAlign: 'center',
  },
  listPadding: {
      paddingHorizontal: 0,
      paddingBottom: 80,
  },
   itemContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxItem: {
    flex: 1,
    paddingVertical: 0,
    marginRight: 0,
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: 'grey',
  },
  itemActions: {
    flexDirection: 'row',
    paddingRight: 8,
  },
  itemDetails: {
    marginLeft: 48,
    marginTop: -8,
    marginBottom: 8,
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemDetailText: {
    marginRight: 8,
    fontSize: 12,
    color: 'grey',
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
   chipText: {
    fontSize: 10,
    lineHeight: 12,
  },
   divider: { // Added divider style
    marginLeft: 16,
    marginRight: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Modal Styles
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalInput: {
    marginBottom: 12,
  },
   quantityRow: { // Style for quantity and unit row
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to top if multiline happens
  },
  quantityInput: {
    flex: 1, // Take up available space
    marginRight: 8, // Add spacing between inputs
  },
  unitInput: {
    flex: 1, // Take up available space
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
});

export default GroceryListScreen;

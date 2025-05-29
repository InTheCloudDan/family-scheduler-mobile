import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, SectionList, FlatList, RefreshControl, Alert } from 'react-native'; // Added Alert
import { Text, Appbar, ActivityIndicator, List, Checkbox, Chip, Divider, Caption, FAB, Portal, Dialog, TextInput, Button, Modal, IconButton, HelperText, Title } from 'react-native-paper'; // Added Modal, IconButton, HelperText, Title
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store'; // Keep AppDispatch
// import { RootState } from '../../store/rootReducer'; // Correct RootState import path - Removed as unused
import {
  fetchPackingLists,
  createPackingList, // Import create list action
  // togglePackingItem, // Replaced by updatePackingItem
  createPackingItem, // Import create item action
  updatePackingItem, // Import update item action
  deletePackingItem, // Import delete item action
  selectPackingListsForVacation,
  selectPackingListById,
  selectPackingListsLoading,
  selectItemUpdateLoading, // Import item update loading selector
  selectVacationsError, // General fetch error
  selectItemUpdateError, // Import item update error selector
  clearItemUpdateError, // Import clear item error action
  PackingList,
  PackingItem
} from '../../store/slices/vacationsSlice';
import { VacationsStackParamList } from '../../navigation/VacationsStackNavigator';

type PackingListScreenRouteProp = RouteProp<VacationsStackParamList, 'PackingList'>;
type PackingListScreenNavigationProp = StackNavigationProp<VacationsStackParamList, 'PackingList'>;

const PackingListScreen = () => {
  const route = useRoute<PackingListScreenRouteProp>();
  const navigation = useNavigation<PackingListScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { vacationId, listId } = route.params; // listId is optional
  // Selectors
  const allPackingLists = useSelector(selectPackingListsForVacation);
  const selectedList = useSelector(selectPackingListById(listId ?? -1));
  const isLoading = useSelector(selectPackingListsLoading); // List loading
  const isItemUpdating = useSelector(selectItemUpdateLoading); // Item CUD loading
  const fetchError = useSelector(selectVacationsError); // General fetch error
  const itemUpdateError = useSelector(selectItemUpdateError); // Item CUD error
  const [isRefreshing, setIsRefreshing] = useState(false);
  // State for Create List Dialog
  const [listDialogVisible, setListDialogVisible] = useState(false);
  const [newListName, setNewListName] = useState('');

  // State for Add/Edit Item Modal
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PackingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1'); // Default quantity as string
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  // TODO: Add state for category, assigned_to if implementing those fields

  // --- Data Fetching & Refresh ---
  const loadLists = useCallback(() => {
    // Fetch only if lists aren't loaded or maybe always if viewing a specific list?
    // For now, fetch if empty or if a specific list is requested but not found yet.
    if (listId && !selectedList && !isLoading) {
        dispatch(fetchPackingLists(vacationId));
    } else if (!listId && allPackingLists.length === 0 && !isLoading) {
       dispatch(fetchPackingLists(vacationId));
    }
  }, [dispatch, vacationId, listId, selectedList, allPackingLists, isLoading]);

  useEffect(() => {
    loadLists();
    // Clear item update error on unmount or when listId changes
    return () => {
        dispatch(clearItemUpdateError());
    };
  }, [loadLists, dispatch, listId]); // Combined load and cleanup

  // Refresh handler - Refetch lists (which contain items)
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchPackingLists(vacationId)).unwrap();
    } catch (e) {
      console.error("Failed to refresh packing data:", e);
      // Optionally show an error message to the user
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, vacationId]);

  // Use updatePackingItem for toggling completion
  const handleToggleItem = (item: PackingItem) => {
    // Pass the correct payload including the 'is_completed' field
    dispatch(updatePackingItem({ id: item.id, is_completed: !item.is_completed }));
    // Note: Error handling is done via the selector below
  };

  const handleSelectList = (selectedListId: number) => {
    navigation.push('PackingList', { vacationId, listId: selectedListId });
  };

  // --- List Dialog Handlers ---
  const showListDialog = () => setListDialogVisible(true);
  const hideListDialog = () => {
      setListDialogVisible(false);
      setNewListName(''); // Clear input on close
  };

  const submitNewList = async () => {
    if (newListName.trim()) {
      try {
        const resultAction = await dispatch(createPackingList({ vacationId, name: newListName.trim() }));
        // Remove unused resultAction assignment
        if (createPackingList.fulfilled.match(resultAction)) {
          // Re-fetch the lists after successful creation
          // dispatch(fetchPackingLists(vacationId)); // Reducer should handle adding now? Let's refetch for safety.
          await dispatch(fetchPackingLists(vacationId)).unwrap(); // Re-fetch and wait
          hideListDialog(); // Close dialog on success
        } else {
           // Handle potential rejection explicitly if needed
           console.error("Failed to create packing list:", resultAction.payload);
           Alert.alert("Error", `Failed to create list: ${resultAction.payload}`);
           // Keep dialog open on error? Or close? Closing for now.
           // hideListDialog();
        }
      } catch (err: any) { // Catch errors from unwrap() if used, or network errors
         Alert.alert("Error", `Failed to create list: ${err.message || 'Unknown error'}`);
         // hideListDialog();
      }
    }
  };

  // --- Item Modal Handlers ---
  const showItemModal = (itemToEdit: PackingItem | null = null) => {
    setEditingItem(itemToEdit);
    setItemName(itemToEdit?.name || '');
    setItemDescription(itemToEdit?.description || '');
    setItemQuantity(String(itemToEdit?.quantity || 1)); // Ensure quantity is a string for TextInput
    setItemFormError(null); // Clear previous errors
    dispatch(clearItemUpdateError()); // Clear previous API errors
    setItemModalVisible(true);
  };

  const hideItemModal = () => {
    setItemModalVisible(false);
    setEditingItem(null); // Clear editing state
    // Optionally clear form fields if desired
    setItemName('');
    setItemDescription('');
    setItemQuantity('1');
    setItemFormError(null);
  };

  const submitItemForm = async () => {
    if (!itemName.trim()) {
      setItemFormError('Item name cannot be empty.');
      return;
    }
    if (!listId) {
        setItemFormError('Cannot determine the packing list.'); // Should not happen
        return;
    }

    const quantityNum = parseInt(itemQuantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
        setItemFormError('Quantity must be a positive number.');
        return;
    }

    setItemFormError(null); // Clear form error

    const payload = {
      name: itemName.trim(),
      description: itemDescription.trim() || undefined,
      quantity: quantityNum,
      // TODO: Add category, assigned_to if implemented
    };

    try {
        if (editingItem) {
          // Update existing item
          await dispatch(updatePackingItem({ id: editingItem.id, ...payload })).unwrap();
        } else {
          // Create new item
          await dispatch(createPackingItem({ packing_list: listId, ...payload })).unwrap();
        }
        hideItemModal(); // Close modal on success (unwrap didn't throw)
        // Reducer handles updating the state, no explicit re-fetch needed here
    } catch (err: any) {
        // Error is handled by the selector and displayed in the modal via itemUpdateError
        console.error("Failed to save item:", err);
        // No need to Alert here, error is shown in modal
    }
  };

   const handleDeleteItem = (item: PackingItem) => {
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
                await dispatch(deletePackingItem(item.id)).unwrap();
                // Reducer handles removing item from state
            } catch (err: any) {
                 Alert.alert('Error', `Failed to delete item: ${err.message || itemUpdateError || 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };


  // --- Item Grouping ---
  const groupedItems = useMemo(() => {
    const items = selectedList?.items || [];
    if (items.length === 0) return [];
    const groups: { [key: string]: PackingItem[] } = {};
    items.forEach(item => {
      // TODO: Fetch category names later
      const categoryName = item.category ? `Category ${item.category}` : 'Uncategorized';
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(item);
    });
    // Sort groups alphabetically, keeping 'Uncategorized' last
    return Object.entries(groups)
        .sort(([catA], [catB]) => {
            if (catA === 'Uncategorized') return 1;
            if (catB === 'Uncategorized') return -1;
            return catA.localeCompare(catB);
        })
        .map(([title, data]) => ({
            title,
            // Sort items within group alphabetically
            data: data.sort((a, b) => a.name.localeCompare(b.name)),
        }));
  }, [selectedList]);

  // Determine title based on whether a specific list is selected
  const screenTitle = selectedList?.name || 'Packing Lists';

  // --- Render Functions ---

  const renderListItem = ({ item }: { item: PackingList }) => (
    <List.Item
      title={item.name}
      description={item.description || (item.is_group ? 'Group List' : `Personal List (${item.owner_details?.username || '...'})`)}
      left={props => <List.Icon {...props} icon={item.is_group ? "account-group" : "account"} />}
      onPress={() => handleSelectList(item.id)}
      // TODO: Add list edit/delete options here? (e.g., onLongPress or right icon)
    />
  );

  const renderItemItem = ({ item }: { item: PackingItem }) => (
    <View>
        <View style={styles.itemContainer}>
        <Checkbox.Item
            style={styles.checkboxItem}
            label={item.name || 'Unnamed Item'}
            status={item.is_completed ? 'checked' : 'unchecked'}
            onPress={() => handleToggleItem(item)} // Pass full item
            labelStyle={item.is_completed ? styles.itemCompleted : null}
            disabled={isItemUpdating} // Disable during any item update
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
            iconColor="red" // Use iconColor instead of color
            onPress={() => handleDeleteItem(item)}
            disabled={isItemUpdating}
          />
        </View>
        </View>
        {/* Details moved below actions, indented */}
        {(item.description || item.assigned_to_details || (item.quantity && item.quantity > 1)) && (
            <View style={styles.itemDetails}>
                {item.quantity && item.quantity > 1 && <Caption style={styles.itemDetailText}>Qty: {item.quantity}</Caption>}
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

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <List.Subheader style={styles.sectionHeader}>{title}</List.Subheader>
  );


  const renderContent = () => {
    // Show loading indicator if loading lists/items and not refreshing
    if (isLoading && !isRefreshing) {
      return <ActivityIndicator animating={true} size="large" style={styles.centered} />;
    }
    // Show fetch error if occurred
    if (fetchError && !isLoading) { // Only show fetch error if not loading
      return <Text style={styles.centered}>Error loading data: {fetchError}</Text>;
    }
    // Note: Item update errors are handled in the modal or via Alert

    if (listId) {
      // --- Display Items using SectionList ---
      if (!selectedList && !isLoading) { // Handle case where listId is provided but list not found
         return <Text style={styles.centered}>List not found.</Text>;
      }
      // Show empty message only if not loading and items are truly empty
      if (selectedList && groupedItems.length === 0 && !isLoading) {
        return <Text style={styles.centered}>No items added yet. Press '+' to add.</Text>;
      }
      // Render SectionList if we have a selected list (even if items are loading initially)
      return (
        <SectionList
          sections={groupedItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItemItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
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
      // --- Display Lists ---
      if (allPackingLists.length === 0 && !isLoading) {
        return <Text style={styles.centered}>No packing lists created yet. Press '+' to add.</Text>;
      }
      return (
        <FlatList
          data={allPackingLists}
          renderItem={renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
           ListEmptyComponent={ // Show only if list is empty *after* potential loading
             !isLoading ? <Text style={styles.centered}>No packing lists created yet. Press '+' to add.</Text> : null
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
         // FAB for adding ITEMS to the current list
         <FAB
            style={styles.fab}
            icon="plus"
            onPress={() => showItemModal()} // Show item modal for adding
            disabled={isItemUpdating || isLoading} // Disable if loading list or updating item
         />
      ) : (
         // FAB for adding LISTS
         <FAB
            style={styles.fab}
            icon="playlist-plus" // Different icon for adding list
            onPress={showListDialog} // Show list dialog
            disabled={isLoading} // Disable if loading lists
         />
      )}


       {/* Create List Dialog */}
       <Portal>
            <Dialog visible={listDialogVisible} onDismiss={hideListDialog}>
            <Dialog.Title>New Packing List</Dialog.Title>
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
                    autoFocus={!editingItem} // Autofocus only when adding
                />
                 <TextInput
                    label="Description (Optional)"
                    value={itemDescription}
                    onChangeText={setItemDescription}
                    mode="outlined"
                    style={styles.modalInput}
                    multiline
                />
                 <TextInput
                    label="Quantity"
                    value={itemQuantity}
                    onChangeText={setItemQuantity}
                    mode="outlined"
                    style={styles.modalInput}
                    keyboardType="numeric"
                    error={!!itemFormError && (isNaN(parseInt(itemQuantity, 10)) || parseInt(itemQuantity, 10) < 1)}
                />
                {/* TODO: Add Category Picker */}
                {/* TODO: Add Assignee Picker */}

                {itemFormError && <HelperText type="error" visible={!!itemFormError}>{itemFormError}</HelperText>}
                {/* Display API error directly in the modal */}
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
    textAlign: 'center', // Center text horizontally
  },
  listPadding: {
      paddingHorizontal: 0, // Remove horizontal padding for list container
      paddingBottom: 80, // Ensure space for FAB
  },
  itemContainer: {
    paddingHorizontal: 0, // No padding here
    paddingVertical: 0, // Reduce vertical padding
    flexDirection: 'row', // Arrange checkbox and actions horizontally
    alignItems: 'center', // Align items vertically
    justifyContent: 'space-between', // Push actions to the right
  },
  checkboxItem: {
    flex: 1, // Allow checkbox item to take available space
    paddingVertical: 0,
    marginRight: 0, // Remove right margin if any
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: 'grey',
  },
  itemActions: { // Container for edit/delete buttons
    flexDirection: 'row',
    paddingRight: 8, // Add some padding so buttons aren't flush right
  },
  itemDetails: {
    // Position details below the main item row
    marginLeft: 48, // Indent details slightly more than checkbox
    marginTop: -8, // Adjust vertical spacing
    marginBottom: 8,
    paddingRight: 16, // Add padding to prevent text hitting edge
    flexDirection: 'row', // Keep details in a row
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping
  },
  itemDetailText: { // Style for quantity/description text
    marginRight: 8,
    fontSize: 12,
    color: 'grey',
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24, // Fixed height for chip
    alignItems: 'center',
    justifyContent: 'center', // Center chip content vertically
    paddingHorizontal: 6, // Adjust padding
  },
   chipText: {
    fontSize: 10,
    lineHeight: 12, // Adjust line height for vertical centering
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    fontWeight: 'bold',
  },
  divider: {
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
});

export default PackingListScreen;

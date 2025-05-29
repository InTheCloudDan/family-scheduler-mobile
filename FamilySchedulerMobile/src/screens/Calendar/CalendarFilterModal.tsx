import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, Checkbox, Divider, /* Chip, */ /* useTheme, */ ActivityIndicator } from 'react-native-paper'; // Chip and useTheme removed
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../../store'; // Adjust path if needed
import {
    setFilters,
    resetFilters,
    fetchFilterOptions,
    selectCalendarFilters,
    selectAvailableInternalCalendars,
    selectAvailableExternalCalendars,
    selectAvailableFamiliesForFilter,
    // selectAvailableMembersForFilter, // Removed unused selector
    selectIsLoadingFilters,
    selectCalendarError,
    CalendarFilters,
    InternalCalendar,
    ExternalCalendarAccount,
} from '../../store/slices/calendarSlice';
import { FamilyGroup /*, User */ } from '../../store/slices/familySlice'; // User removed

interface CalendarFilterModalProps {
    visible: boolean;
    onDismiss: () => void;
    onApplyFilters: (filters: CalendarFilters) => void;
}

const CalendarFilterModal: React.FC<CalendarFilterModalProps> = ({ visible, onDismiss, onApplyFilters }) => {
    // const theme = useTheme(); // Removed unused theme
    const dispatch = useDispatch<AppDispatch>();

    // Selectors
    const currentFilters = useSelector(selectCalendarFilters);
    const availableInternal = useSelector(selectAvailableInternalCalendars);
    const availableExternal = useSelector(selectAvailableExternalCalendars);
    const availableFamilies = useSelector(selectAvailableFamiliesForFilter);
    // const availableMembers = useSelector(selectAvailableMembersForFilter); // Removed unused members
    const isLoading = useSelector(selectIsLoadingFilters);
    const error = useSelector(selectCalendarError);

    // Local state for temporary filter selections
    const [localFilters, setLocalFilters] = useState<CalendarFilters>(currentFilters);

    // Fetch filter options when the modal becomes visible if data is missing
    useEffect(() => {
        if (visible && availableInternal.length === 0 && availableExternal.length === 0 && availableFamilies.length === 0 && !isLoading) {
            dispatch(fetchFilterOptions());
        }
    }, [visible, dispatch, isLoading, availableInternal, availableExternal, availableFamilies]);

    // Update local state if global filters change (e.g., after reset)
    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);

    const handleCheckboxChange = (
        filterKey: keyof CalendarFilters,
        value: number | 'PUBLIC' | 'PRIVATE' | 'PERSONAL', // More specific type
        isChecked: boolean
    ) => {
        setLocalFilters(prevFilters => {
            const currentSelection = prevFilters[filterKey]; // Type inferred correctly by TS now
            let newSelection;

            if (isChecked) {
                // Add to selection if not already present
                // Need type guards to handle the union type correctly
                if (typeof value === 'number') {
                    newSelection = [...(currentSelection as number[]), value];
                    newSelection = [...new Set(newSelection)]; // Ensure uniqueness for numbers
                } else { // value is 'PUBLIC', 'PRIVATE', or 'PERSONAL'
                    newSelection = [...(currentSelection as string[]), value];
                     newSelection = [...new Set(newSelection)]; // Ensure uniqueness for strings
                }
            } else {
                // Remove from selection
                 if (typeof value === 'number') {
                    newSelection = (currentSelection as number[]).filter(item => item !== value);
                 } else {
                    newSelection = (currentSelection as string[]).filter(item => item !== value);
                 }
            }

            return { ...prevFilters, [filterKey]: newSelection as any }; // Use 'as any' for simplicity here, or refine types further
        });
    };

    const handleApply = () => {
        dispatch(setFilters(localFilters));
        onApplyFilters(localFilters); // Pass filters back to parent screen
        onDismiss();
    };

    const handleReset = () => {
        dispatch(resetFilters());
        // No need to call onApplyFilters here, parent will react to Redux state change
        onDismiss();
    };

    const renderFilterSection = <T extends { id: number; name: string }>(
        title: string,
        items: T[],
        filterKey: keyof CalendarFilters,
        renderItemName?: (item: T) => string // Optional custom name renderer
    ) => {
        // Ensure localFilters[filterKey] is treated as an array of numbers for .includes()
        const selectedIds = localFilters[filterKey] as number[];
        return (
            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>{title}</Text>
                {items.map(item => (
                    <Checkbox.Item
                        key={item.id}
                        label={renderItemName ? renderItemName(item) : item.name}
                        status={selectedIds.includes(item.id) ? 'checked' : 'unchecked'}
                        onPress={() => handleCheckboxChange(filterKey, item.id, !selectedIds.includes(item.id))}
                        style={styles.checkboxItem}
                        labelStyle={styles.checkboxLabel}
                    />
                ))}
                <Divider style={styles.divider} />
            </View>
        );
    };

    const renderVisibilitySection = () => {
        const visibilities: CalendarFilters['visibilities'] = ['PUBLIC', 'PRIVATE', 'PERSONAL'];
        return (
            <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>Visibility</Text>
                {visibilities.map(visibility => (
                    <Checkbox.Item
                        key={visibility}
                        label={visibility.charAt(0) + visibility.slice(1).toLowerCase()} // Capitalize
                        status={localFilters.visibilities.includes(visibility) ? 'checked' : 'unchecked'}
                        onPress={() => handleCheckboxChange('visibilities', visibility, !localFilters.visibilities.includes(visibility))}
                        style={styles.checkboxItem}
                        labelStyle={styles.checkboxLabel}
                    />
                ))}
                <Divider style={styles.divider} />
            </View>
        );
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
                <ScrollView style={styles.scrollView}>
                    <Text variant="headlineSmall" style={styles.title}>Filter Events</Text>

                    {isLoading && <ActivityIndicator animating={true} style={styles.loader} />}
                    {error && <Text style={styles.errorText}>Error loading filters: {error}</Text>}

                    {!isLoading && !error && (
                        <>
                            {renderFilterSection<InternalCalendar>("My Calendars", availableInternal, 'internalCalendars')}
                            {renderFilterSection<ExternalCalendarAccount>("External Calendars", availableExternal, 'externalCalendars')}
                            {renderFilterSection<FamilyGroup>("Families", availableFamilies, 'families')}
                            {renderVisibilitySection()}
                            {/* Placeholder for Members filter - requires backend endpoint and data */}
                            {/* {renderFilterSection<User>("Members", availableMembers, 'members', (user) => `${user.first_name} ${user.last_name}`)} */}
                             <View style={styles.section}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>Members</Text>
                                <Text style={styles.placeholderText}>Member filtering requires backend update.</Text>
                                <Divider style={styles.divider} />
                            </View>
                        </>
                    )}

                    <View style={styles.buttonContainer}>
                        <Button mode="outlined" onPress={handleReset} style={styles.button}>
                            Reset
                        </Button>
                        <Button mode="contained" onPress={handleApply} style={styles.button}>
                            Apply
                        </Button>
                    </View>
                </ScrollView>
            </Modal>
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '85%', // Limit height
    },
    scrollView: {
        // Takes available space within maxHeight
    },
    title: {
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        marginBottom: 10,
        fontWeight: 'bold',
    },
    checkboxItem: {
        paddingVertical: 0, // Reduce vertical padding
        minHeight: 30, // Reduce min height
    },
    checkboxLabel: {
        fontSize: 14, // Adjust font size if needed
    },
    divider: {
        marginTop: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingBottom: 10, // Add padding at the bottom
    },
    button: {
        flex: 1,
        marginHorizontal: 5,
    },
    loader: {
        marginVertical: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 15,
    },
    placeholderText: {
        fontStyle: 'italic',
        color: 'grey',
        marginLeft: 10, // Indent slightly
    },
});

export default CalendarFilterModal;

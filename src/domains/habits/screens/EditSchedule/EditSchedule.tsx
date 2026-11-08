import { View, Text, ScrollView, Switch } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import Button from 'src/domains/misc/components/Button'
import groupsAtom, { withGroupUpdated } from 'src/domains/habits/stores/groups'
import RecurrenceTypeCard from './RecurrenceTypeCard'
import NumberStepper from './NumberStepper'
import DayChips from './DayChips'
import {
  RECURRENCE_TYPES, WEEKDAYS,
} from 'src/domains/recurrence/utils/recurrence'
import type { RecurrenceType, Weekday } from 'src/domains/recurrence/utils/recurrence'
import { isRecurrenceTypeImplemented } from 'src/domains/recurrence/utils/getOccurrence'
import { StaticScreenProps, useNavigation } from '@react-navigation/native'
import { objectFromEntries, objectKeys } from 'tsafe'
import { isTruthy, pickBy } from 'remeda'

type Props = StaticScreenProps<{
  groupId: string,
}>

const VALUE_LABELS: Record<RecurrenceType, string> = {
  'times-per-day': 'Times per day',
  'every-x-hours': 'Hours',
  'every-x-days': 'Days',
  'times-per-week': 'Times per week',
  'times-per-month': 'Times per month',
}

const EditSchedule = ({ route }: Props) => {
  const { groupId } = route.params
  const navigation = useNavigation()

  const initialConfig = useAtomValue(groupsAtom)[groupId].recurrence
  const setGroups = useSetAtom(groupsAtom)
  const [selectedType, setSelectedType] = useState<RecurrenceType | null>(initialConfig?.type ?? null)
  const [value, setValue] = useState(initialConfig?.value ?? 2)
  const initialWeekdays = initialConfig?.specificDays ?
    objectKeys(pickBy(initialConfig.specificDays, isTruthy)) :
    []
  const [specificDays, setSpecificDays] = useState<Weekday[]>(initialWeekdays)
  const [specificDaysEnabled, setSpecificDaysEnabled] = useState(!!initialWeekdays.length)
  const hasExistingRecurrence = !!initialConfig

  const handleSave = () => {
    if (!selectedType) return

    const recurrence = {
      type: selectedType,
      value,
      specificDays: specificDaysEnabled && specificDays.length ? objectFromEntries(
        WEEKDAYS.map(weekday => [weekday, specificDays.includes(weekday)])
      ) : undefined,
    }
    setGroups(groups => withGroupUpdated(groups, groupId, group => ({ ...group, recurrence })))
    navigation.goBack()
  }

  const handleClear = () => {
    setGroups(groups => withGroupUpdated(groups, groupId, ({ recurrence: _cleared, ...group }) => group))
    navigation.goBack()
  }

  const valueLabel = selectedType ? VALUE_LABELS[selectedType] : 'Value'

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Schedule</Text>
      <ScrollView nestedScrollEnabled contentContainerStyle={styles.content}>

        <View style={styles.typeList}>
          {RECURRENCE_TYPES.map(type => (
            <RecurrenceTypeCard
              key={type}
              type={type}
              isSelected={selectedType === type}
              disabled={!isRecurrenceTypeImplemented(type)}
              onPress={() => void setSelectedType(type)}
            >
              <NumberStepper
                value={value}
                label={valueLabel}
                onChange={setValue}
                min={1}
                max={selectedType === 'times-per-day' ? 12 : 30}
              />
            </RecurrenceTypeCard>
          ))}
        </View>

        <View style={styles.restrictSection}>
          <View style={styles.restrictRow}>
            <Text style={styles.restrictLabel}>Restrict to specific days</Text>
            <Switch
              value={specificDaysEnabled}
              onValueChange={setSpecificDaysEnabled}
            />
          </View>
          {specificDaysEnabled && (
            <DayChips
              selected={specificDays}
              onChange={setSpecificDays}
            />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Save schedule"
            onPress={handleSave}
            disabled={!selectedType}
          />
          {hasExistingRecurrence && (
            <Button
              title="Remove schedule"
              onPress={handleClear}
              variant="secondary"
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default EditSchedule

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    paddingVertical: theme.spacing['4xl'],
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xl,
  },
  content: {
    padding: theme.spacing['3xl'],
    gap: theme.spacing.xl,
  },
  kicker: {
    ...theme.typography.label,
    color: theme.colors.textTertiary,
    paddingHorizontal: theme.spacing['3xl'],
  },
  typeList: {
    gap: theme.spacing.sm,
  },
  daySection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  daySectionLabel: {
    ...theme.typography.label,
    color: theme.colors.background,
    opacity: 0.6,
  },
  restrictSection: {
    gap: theme.spacing.md,
  },
  restrictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restrictLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  actions: {
    gap: theme.spacing.md,
  },
}))

import { View, Text, ScrollView, Switch } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useSelector, useValue } from '@legendapp/state/react'
import Button from 'src/domains/misc/components/Button'
import groups$ from 'src/domains/habits/stores/groups'
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

  const initialConfig = useValue(() => groups$[groupId].recurrence.get())
  const selectedType$ = useObservable<RecurrenceType | null>(initialConfig?.type ?? null)
  const value$ = useObservable(initialConfig?.value ?? 2)
  const initialWeekdays = initialConfig?.specificDays ?
    objectKeys(pickBy(initialConfig.specificDays, isTruthy)) :
    []
  const specificDays$ = useObservable<Weekday[]>(initialWeekdays)
  const specificDaysEnabled$ = useObservable(!!initialWeekdays.length)

  const handleSave = () => {
    const type = selectedType$.get()
    if (!type) return

    groups$[groupId].recurrence.set({
      type,
      value: value$.get(),
      specificDays: specificDays$.get().length ? objectFromEntries(
        WEEKDAYS.map(weekday => [
          weekday,
          specificDays$.get().includes(weekday),
        ])
      ) : undefined,
    })
    navigation.goBack()
  }

  const handleClear = () => {
    groups$[groupId].recurrence.delete()
    navigation.goBack()
  }

  const selectedType = useValue(selectedType$)
  const value = useValue(value$)
  const specificDays = useValue(specificDays$)
  const specificDaysEnabled = useValue(specificDaysEnabled$)
  const hasExistingRecurrence = useSelector(() => !!groups$[groupId].recurrence.get())

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
              onPress={() => void selectedType$.set(type)}
            >
              <NumberStepper
                value={value}
                label={valueLabel}
                onChange={v => void value$.set(v)}
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
              onValueChange={v => void specificDaysEnabled$.set(v)}
            />
          </View>
          {specificDaysEnabled && (
            <DayChips
              selected={specificDays}
              onChange={days => void specificDays$.set(days)}
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

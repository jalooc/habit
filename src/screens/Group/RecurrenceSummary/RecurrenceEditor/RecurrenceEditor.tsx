import { View, Text, ScrollView, Switch } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { useObservable, useSelector, useValue } from '@legendapp/state/react'
import { groups$, dayBoundaries$ } from '../../../../stores'
import Button from '../../../../components/Button'
import RecurrenceTypeCard from './RecurrenceTypeCard'
import NumberStepper from './NumberStepper'
import DayChips from './DayChips'
import {
  RECURRENCE_TYPES,
  buildRRule,
  parseRRule,
} from './recurrence'
import type { RecurrenceType, Weekday } from './recurrence'

type Props = {
  groupId: string
  onDismiss: () => void
}

const VALUE_LABELS: Record<RecurrenceType, string> = {
  'times-per-day': 'Times per day',
  'every-x-hours': 'Hours',
  'every-x-days': 'Days',
  'times-per-week': 'Times per week',
  'times-per-month': 'Times per month',
}

const getInitialConfig = (groupId: string) => {
  const recurrence = groups$[groupId].recurrence.get()
  if (!recurrence) return undefined
  return parseRRule(String(recurrence))
}

const RecurrenceEditor = ({ groupId, onDismiss }: Props) => {
  const initialConfig = getInitialConfig(groupId)
  const selectedType$ = useObservable<RecurrenceType | null>(initialConfig?.type ?? null)
  const value$ = useObservable(initialConfig?.value ?? 2)
  const specificDays$ = useObservable<Weekday[]>(initialConfig?.specificDays ?? [])
  const restrictDaysEnabled$ = useObservable(!!initialConfig?.restrictDays?.length)
  const restrictDays$ = useObservable<Weekday[]>(initialConfig?.restrictDays ?? [])

  const handleSave = () => {
    const type = selectedType$.get()
    if (!type) return

    const dayBounds = dayBoundaries$.get()
    const rule = buildRRule(
      {
        type,
        value: value$.get(),
        specificDays: specificDays$.get(),
        restrictDays: restrictDaysEnabled$.get() ? restrictDays$.get() : undefined,
      },
      dayBounds
    )
    groups$[groupId].recurrence.set(rule)
    onDismiss()
  }

  const handleClear = () => {
    groups$[groupId].recurrence.delete()
    onDismiss()
  }

  const selectedType = useValue(selectedType$)
  const value = useValue(value$)
  const specificDays = useValue(specificDays$)
  const restrictDaysEnabled = useValue(restrictDaysEnabled$)
  const restrictDays = useValue(restrictDays$)
  const hasExistingRecurrence = useSelector(() => !!groups$[groupId].recurrence.get())

  const showSpecificDays = selectedType === 'times-per-week'
  const valueLabel = selectedType ? VALUE_LABELS[selectedType] : 'Value'

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <ScrollView nestedScrollEnabled contentContainerStyle={styles.content}>

        <View style={styles.typeList}>
          {RECURRENCE_TYPES.map(type => (
            <RecurrenceTypeCard
              key={type}
              type={type}
              isSelected={selectedType === type}
              onPress={() => selectedType$.set(type)}
            >
              <NumberStepper
                value={value}
                label={valueLabel}
                onChange={v => value$.set(v)}
                min={1}
                max={selectedType === 'times-per-day' ? 12 : 30}
              />
              {showSpecificDays && (
                <View style={styles.daySection}>
                  <Text style={styles.daySectionLabel}>On specific days</Text>
                  <DayChips
                    selected={specificDays}
                    onChange={days => specificDays$.set(days)}
                  />
                </View>
              )}
            </RecurrenceTypeCard>
          ))}
        </View>

        <View style={styles.restrictSection}>
          <View style={styles.restrictRow}>
            <Text style={styles.restrictLabel}>Restrict to specific days</Text>
            <Switch
              value={restrictDaysEnabled}
              onValueChange={v => restrictDaysEnabled$.set(v)}
            />
          </View>
          {restrictDaysEnabled && (
            <DayChips
              selected={restrictDays}
              onChange={days => restrictDays$.set(days)}
            />
          )}
        </View>

        <View style={styles.actions}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!selectedType}
          />
          {hasExistingRecurrence && (
            <Button
              title="Remove Schedule"
              onPress={handleClear}
              variant="secondary"
            />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default RecurrenceEditor

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
  title: {
    ...theme.typography.heading,
    color: theme.colors.text,
  },
  typeList: {
    gap: theme.spacing.md,
  },
  daySection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  daySectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
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

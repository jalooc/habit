// prototype.jsx — Live interactive app shell.
// Owns nav stack + groups state. Drops the chosen ring metaphor into every
// screen. Used both as a standalone (prototype.html) and as the hero artboard
// on the design canvas.

const { useState: useSp, useRef: useRp } = React;

function OrbitInkApp({ ringId, initialRoute = 'home', initialGroups }) {
  const [groups, setGroups] = useSp(initialGroups || SAMPLE_GROUPS);
  const [stack, setStack] = useSp([{ name: initialRoute }]);
  const route = stack[stack.length - 1];
  const go = (r) => setStack((s) => [...s, r]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const setTab = (name) => setStack([{ name }]);

  let screen;
  if (route.name === 'home') {
    screen = groups.length === 0
      ? <EmptyScreen go={go} />
      : <TodayScreen groups={groups} setGroups={setGroups} go={go} ringId={ringId} />;
  }
  else if (route.name === 'groups') screen = <RotationsScreen groups={groups} go={go} ringId={ringId} />;
  else if (route.name === 'group') screen = <GroupScreen group={groups.find((g) => g.id === route.id)} setGroups={setGroups} go={go} back={back} ringId={ringId} />;
  else if (route.name === 'create') screen = <CreateScreen back={back} setGroups={setGroups} ringId={ringId} />;
  else if (route.name === 'edit') screen = <CreateScreen back={back} setGroups={setGroups} ringId={ringId} initial={groups.find((g) => g.id === route.id)} />;
  else if (route.name === 'settings') screen = <SettingsScreen />;
  else if (route.name === 'stats') screen = <StatsScreen groups={groups} />;
  else if (route.name === 'empty') screen = <EmptyScreen go={go} />;
  else if (route.name === 'onboarding') screen = <OnboardingScreen onFinish={() => setTab('home')} />;
  else screen = <TodayScreen groups={groups} setGroups={setGroups} go={go} ringId={ringId} />;

  const { t } = useTokens();
  return (
    <div data-screen-label={route.name} style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: t.bg, color: t.ink,
    }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{screen}</div>
      <TabBar active={['home','groups','stats','settings'].includes(route.name) ? route.name : 'home'} onTab={setTab} />
    </div>
  );
}

Object.assign(window, { OrbitInkApp });

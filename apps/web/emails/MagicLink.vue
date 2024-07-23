<script setup lang="ts">
  const colors = {
    mutedForeground: "#64748b",
  };

  const props = defineProps<{
    name: string;
    otp: string;
    url: string;
  }>();
</script>

<template>
  <Wrapper>
    <EText>
      Hey {{ props.name }}, <br />
      you requested a login email from ZuckerBot.
      <br />
      <br />
      You can either enter the one-time password below manually in the
      application.
    </EText>

    <EText>
      One-time password:
      <br />
      <strong
        :style="{ fontSize: '24px', lineHeight: '32px', fontWeight: 'bold' }"
        >{{ props.otp }}</strong
      >
    </EText>

    <EText>or use this link:</EText>
    <br />
    <br />
    <PrimaryButton :href="props.url">Continue &rarr;</PrimaryButton>
    <br />

    <EText
      :style="{
        fontSize: '14px',
        lineHeight: '20px',
        color: colors.mutedForeground,
      }"
    >
      If you want to open the link in a different browser than your default one,
      copy and paste this link:
      <ELink :href="props.url">{{ props.url }}</ELink>
    </EText>
  </Wrapper>
</template>

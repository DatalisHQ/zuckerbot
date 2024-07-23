<script setup lang="ts">
  const colors = {
    card: "#ffffff",
  };
</script>

<template>
  <Wrapper>
    <ESection :style="{ backgroundColor: colors.card, padding: '32px' }">
      <EContainer>
        <EHeading as="h1">Welcome to our newsletter!</EHeading>
        <EText>Thank you for signing up for the ZuckerBot newsletter.</EText>
      </EContainer>
    </ESection>
  </Wrapper>
</template>

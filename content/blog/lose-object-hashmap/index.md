---
title: How to lose an object in HashMap
date: 2016-05-16
type: post
---

[Map][map-api] is a common tool from java programmer's toolbox that is used to store key-value pairs. When such a data structure is needed in our programs, most of the time the code looks similar to:

```java
Map<String, Integer> values = new HashMap<>();
```

We know that the class of the key needs to implement `int hashCode()` and `boolean equals(Object obj)` methods in order to store and retrieve objects from the `HashMap` and that's because:

1. `hashCode()` is used to determine the bucket where the key-value pair will be stored
2. `equals(Object obj)` is used to determine the right key-value pair when multiple keys have the same hashCode.

I do not remember where I learned these rules but now I know that not from the java API:

* [Map][map-api] only mentions that
> Implementations are free to implement optimizations whereby the equals invocation is avoided, for example, by first comparing the hash codes of the two keys.

* [HashMap][hashmap-api] reminds us about `hashCode()`
> Note that using many keys with the same hashCode() is a sure way to slow down performance of any hash table.

* Finally [Hashtable][hashtable-api] states it clearly
> To successfully store and retrieve objects from a hashtable, the objects used as keys must implement the hashCode method and the equals method.

Now that we know what to implement for a class that is used as a key in a map, we may came up with:

```java
class Key {
    private String value;

    public Key(String value) {
        this.value = value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        Key other = (Key) obj;

        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value;
    }
}
```

At first glance this class looks right, it has both `equals` and `hashCode` so what could go wrong? If you look more carefully you'll notice that it is mutable. In this case it is possible that a key is changed after it is added to the map. If this happens, prepare yourself for severe headaches. Let's look at the following scenario:

```java
public class HowToLoseAnObjectInHashMap {

    public static void main(String... args) {
        Map<Key, String> map = new HashMap<>();

        Key key = new Key("key1");
        map.put(key, "value1");
        printMapAndValue(map, new Key("key1"));

        key.setValue("key2");
        printMapAndValue(map, new Key("key1"));
        printMapAndValue(map, new Key("key2"));

        key.setValue("key1");
        printMapAndValue(map, new Key("key1"));
    }

    static void printMapAndValue(Map<Key, String> map, Key key) {
        System.out.println("-------------------------------------");
        System.out.println("map: " + map);
        System.out.println("map.get(" + key + "): " + map.get(key));
    }

}
```

After the key was added to the map, I changed its value. Lookup does not work for both keys:
* key1 is not found because the map contains only one key, key2.
* key2 is not found because it has a different `hashCode` so the lookup is done in another bucket.

Running the example displays:

```
-------------------------------------
map: {key1=value1}
map.get(key1): value1
-------------------------------------
map: {key2=value1}
map.get(key1): null
-------------------------------------
map: {key2=value1}
map.get(key2): null
-------------------------------------
map: {key1=value1}
map.get(key1): value1
```

If no value is returned, we might realize that we have a problem and fix it. Unfortunately things can go really wrong and we can have a situation where both keys have the same `hashCode`. In this case the value is returned with the wrong key. The simple way to show this is to change the `hashCode` implementation with:

```java
@Override
public int hashCode() {
    return 1; //value.hashCode();
}
```

and run the example again:

```
-------------------------------------
map: {key1=value1}
map.get(key1): value1
-------------------------------------
map: {key2=value1}
map.get(key1): null
-------------------------------------
map: {key2=value1}
map.get(key2): value1
-------------------------------------
map: {key1=value1}
map.get(key1): value1
```

In this case we found the value with the wrong key, key2.

The simplest fix for this problem is to make the class of the key immutable. If that is not possible, make sure that keys are not changed.

[map-api]: https://docs.oracle.com/javase/8/docs/api/java/util/Map.html
[hashmap-api]: https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html
[hashtable-api]: https://docs.oracle.com/javase/8/docs/api/java/util/Hashtable.html
